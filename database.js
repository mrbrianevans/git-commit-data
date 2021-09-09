
import Timer from 'timer-logs'
import sequelizepkg from 'sequelize';
const { Sequelize, DataTypes, Model } = sequelizepkg;

const timer = new Timer.default({filename: 'database.js', environment: 'development'})

export const createTables = async(recreateTables) => {
	const sequelize = new Sequelize({
	  dialect: 'sqlite',
	  storage: 'certus.db',
	  logging: (...m)=>timer.tsql([m[0]], ...m[1]?.bind??[]),
	  //logging: (...m)=>console.info(m)
	});

	class Task extends Model {}
	class Commit extends Model {}
	class WorkLog extends Model {}
	
	Task.init({
		id: {
			type: DataTypes.STRING,
			primaryKey: true,
			validate: {
				is: /^[a-z]{6}-[0-9]+$/i
			}
		},
		title: DataTypes.STRING,
		assignee: DataTypes.STRING,
		project: DataTypes.STRING,
		originalEstimateHours: DataTypes.FLOAT,
		totalTimeSpentHours: DataTypes.FLOAT
	}, { sequelize, modelName: 'Task', timestamps: false })

	Commit.init({
		hash: {
			type: DataTypes.STRING,
			primaryKey: true
		},
		message: DataTypes.STRING,
		
		taskId: {
			type: DataTypes.STRING,
			references: {
				model: Task,
				key: 'id'
			},
			comment: 'JIRA task id without leading hash'
		},
		description: DataTypes.STRING,
		timestamp: {
			type: DataTypes.DATE,
			allowNull: false
		},
		repository: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}, {sequelize, modelName: 'Commit', timestamps: false})
		
	WorkLog.init({
		time: {
			type: DataTypes.DATE,
			primaryKey: true
		},
		taskId: {
			type: DataTypes.STRING,
			references: {
				model: Task,
				key: 'id'
			},
			comment: 'JIRA task id'
		},
		comment: DataTypes.STRING,
		durationHours: DataTypes.FLOAT,
	}, { sequelize, modelName: 'WorkLog', timestamps: false})
	
	Task.hasMany(Commit, {
	  foreignKey: 'taskId'
	})
	Commit.belongsTo(Task, {
	  foreignKey: 'taskId'
	})
	Task.hasMany(WorkLog, {
	  foreignKey: 'taskId'
	})
	WorkLog.belongsTo(Task, {
	  foreignKey: 'taskId'
	})
	timer.start('create tables')
	await sequelize.authenticate()
	timer.info("authenticated")
	await sequelize.sync({force: recreateTables})
	timer.flush()
	return { Task, Commit, WorkLog }
}
