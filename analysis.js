import Timer from 'timer-logs'
import * as fs from 'fs'
import sequelizepkg from 'sequelize';
const { Op } = sequelizepkg;
import {createTables} from './database.js'

const timer = new Timer.default({filename: 'analysis.js', environment: 'development'})

const analyse = async() => {
	const { Commit, Task, WorkLog } = await createTables(false)
	const commits = await Commit.findAll({include: Task})
	const tasks = await Task.findAll()
	const workLogs = await WorkLog.findAll({include: Task})
	timer.info('Commit.count', commits.length)
	timer.info('Task.count', tasks.length)
	timer.info('WorkLog.count', workLogs.length)
	/*
	console.log(commits.slice(0,2).map(c=>c.toJSON()))
	console.log(tasks.slice(0,2).map(c=>c.toJSON()))
	console.log(workLogs.slice(0,2).map(c=>c.toJSON()))
	*/
	const commit = await Commit.findOne({ where: { message: { [Op.like]: '% rag %' } }, include: Task })
	console.log(commit.toJSON())
}

analyse().then(()=>timer.flush())