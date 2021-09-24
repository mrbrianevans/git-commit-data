# git-commit-data
Load git commit data into a SQL database for analysis

## How to use
Export commit data using the script from this gist: [Git log in JSON format](https://gist.github.com/varemenos/e95c2e098e657c7688fd)

Run this command in the root of the git repo:
```powershell
git log --pretty=format:'{%n  "commit": "%H",%n  "abbreviated_commit": "%h",%n  "tree": "%T",%n  "abbreviated_tree": "%t",%n  "parent": "%P",%n  "abbreviated_parent": "%p",%n  "refs": "%D",%n  "encoding": "%e",%n  "subject": "%s",%n  "sanitized_subject_line": "%f",%n  "body": "%b",%n  "commit_notes": "%N",%n  "verification_flag": "%G?",%n  "signer": "%GS",%n  "signer_key": "%GK",%n  "author": {%n    "name": "%aN",%n    "email": "%aE",%n    "date": "%aD"%n  },%n  "commiter": {%n    "name": "%cN",%n    "email": "%cE",%n    "date": "%cD"%n  }%n},'
```
and redirect the output to a file with ` > name-of-repo.json` after the command. 
If you only want to export commits made by yourself, you can add `--author="your name"` to the `git log` command to filter. 
For more details about `git log` see [git-scm.com/docs/git-log](https://www.git-scm.com/docs/git-log).

This program expects a directory named `commit-data` to contain only JSON files produced by the above command.

You can also load a JIRA timesheet into the database, by providing a file named `timesheets.csv` in the root directory. 

Install required packages using `npm i` in the root of this repository.

Run `node insertData.js` to load the data from the JSON files and csv timesheet into a SQLite database with sequelize models.

Example file structure for this to work:
- `/`
  - `timesheets.csv`
  - `commit-data`
    - `repo-name.json`
  - `insertData.js` (from git)
  - `database.js` (from git)
