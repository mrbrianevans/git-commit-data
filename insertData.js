import Timer from 'timer-logs'
import * as fs from 'fs'
import { parseFile } from 'fast-csv';
import {createTables} from './database.js'
import * as csv from 'fast-csv';

const timer = new Timer.default({filename: 'insertData.js', environment: 'development'})


const insertData = async()=>{
	const { Commit, Task, WorkLog } = await createTables(true)

//insert task list
	const workLogs = await new Promise((resolve, reject)=>{
		parseFile('timesheets.csv', {headers: true})
			.on('error', e=>timer.genericError(e))
			.on('data', async (d)=>{
				if(!d || !d.Issue.match(/([a-z]{6,7}-[0-9]*) - (.*)/i)) {
					console.log(d)
					reject('Found a null row in timesheet csv file: '+d?.Issue)
					return
				}
				const [, taskId, title] = d.Issue.match(/([a-z]{6,7}-[0-9]*) - (.*)/i)
				await Task.upsert({id: taskId, project: d.Project, assignee: d.Assignee, title,
				originalEstimateHours: Number(d['Original Estimate']), totalTimeSpentHours: Number(d['Time Spent'])
				})
				await WorkLog.upsert({time: d['Worklog Day and Time'], taskId, 
					comment: d['Worklog Comment'], durationHours: d['Time Logged'] 
				})
			})
			.on('end', resolve)
	})
	timer.tlog`Read ${workLogs} work log lines`
	
// insert commit history
	const repos = fs.readdirSync('commit-data')
	const readCommitFile = (filename) => {
		const commitsJson = fs.readFileSync(`commit-data/${filename}`)
								.toString()
								.replaceAll(/\n\s*"[^"]+": "(.*".*)",\n/g, (m, n)=>m.replace(n, n.replaceAll(/"/g, "\\\""))) // replace double quotes
								.replaceAll(/([^",}{[\]])\n+/g, '$1\\n') // replace newlines in multiline strings
								.replaceAll(/\t/g, '\\t') // replace tab characters

		const commits = JSON.parse('['+commitsJson.slice(0,-1)+']')
		return commits
	}
	const repoCommits = new Map(repos.map(repo=>[repo.split('.')[0], readCommitFile(repo)]))

	for(const [repo, commits] of repoCommits){
		for(const commit of commits){
			const [,tag, description] = commit.body.trim().match(/#([a-z]{6,7}-[0-9]*)((?:.|\n)*)/i) ?? [null, null, null]
			//timer.tlog`${tag} ${new Date(commit.author.date).toDateString()} ${repo} ${commit.subject}`
			if(tag) await Task.upsert({id: tag}) // make sure the tag exists
			await Commit.upsert(
				{ taskId: tag, hash: commit.commit, message: commit.subject, 
				timestamp: commit.author.date, description: description?.trim() ? description.trim() : null,
				repository: repo
				})
		}

		timer.info(commits.length, 'commits to', repo)
	}
}

//timer.tsql`SELECT * FROM commits c JOIN author a ON c.author = a.id WHERE repo=${'oxlip'} and date<${new Date()} or age>${1} and author@@${{name:'Brian Evans'}}`

insertData().then(()=>timer.flush())