/**
* Returns various Git information
*/

var _ = require('lodash');
var hashedReleaseName = require('hashed-release-name');
var exec = require('@momsfriendlydevco/exec');
var fs = require('fs');
var spawn = require('child_process').spawn;

var git = module.exports = {};


/**
* Returns the latest Git snapshot
* @param {Object} [options] Options as passed to app.git.history()
* @returns {Promise} A promise resolved with an object of keys including `hash`, `shortHash`, `date`, `committer` and `subject`
*/
git.current = options => git.history({...options, limit: 1}).then(history => history[0]);


/**
* Returns some historical Git data
* @param {Object} [options] Options to specify
* @param {number} [options.limit=30] The number of rows to return
* @param {boolean} [options.firstLine=true] Only show first line of any multi-line commit messages, disabling this returns the raw subject
* @returns {Promise} A promise which will resolve with the Git history collection
*/
git.history = options => {
	var settings = {
		limit: 30,
		firstLine: true,
		...options,
	};

	return exec([
		'git',
		'log',
		'--pretty=format:%H|%h|%cI|%cn|%B---END---',
		`--max-count=${settings.limit}`,
	], {buffer: true})
		.then(data => _(data)
			.split('---END---')
			.map(line => {
				var gitInfo = _.trim(line).split('|');
				if (!gitInfo[0]) return; // Last item in list
				return {
					release: hashedReleaseName({
						alliterative: true,
						hash: gitInfo[0],
						transformer: phrase => _.startCase(phrase),
					}),
					hash: gitInfo[0],
					shortHash: gitInfo[1],
					date: gitInfo[2],
					committer: gitInfo[3],
					subject: settings.firstLine ? gitInfo[4].split('\n', 2)[0] : gitInfo[4],
				};
			})
			.filter()
			.value()
		)
};


/**
* Retrieves all git history up until the last bookmark
* Bookmarks are saved on each request, effectively draining the queue. This is intended so that the history since a bookmark can be returned - e.g. by deploy processes
* Bookmark positions are read / written at `./git/doop-git-bookmarks.json`
* If a book mark is NOT found no history is returned the first time - as we have no frame of reference
* @param {string} bookmark The nominated string to filter to, this is saved after each fetch
*/
git.historySinceBookmark = bookmark =>
	Promise.resolve()
		.then(()=> bookmark || Promise.reject('app.git.historySince() must have a specified bookmark'))
		.then(()=> Promise.all([
			// Read bookmark file
			fs.promises.readFile(`${app.config.paths.root}/.git/doop-git-bookmarks.json`).catch(e => '{}')
				.then(contents => JSON.parse(contents)),

			// Fetch git history
			git.history({limit: 30}),
		]))
		.then(data => {
			var [bookmarks, history] = data;
			var historyFiltered;

			if (bookmarks[bookmark]) { // Bookmark exists - use it
				historyFiltered = _(history)
					.dropRightWhile(h => h.shortHash != bookmarks[bookmark]) // Filter history to that hash
					.dropRight() // Remove latest also
					.reverse()
					.value()
			} else { // No bookmark, do nothing
				historyFiltered = [];
			}

			return fs.promises.writeFile(`${app.config.paths.root}/.git/doop-git-bookmarks.json`, JSON.stringify({ // Write bookmarks back and return filtered history
				...bookmarks,
				[bookmark]: history[0].shortHash,
			}, null, '\t')).then(()=> historyFiltered);
		});
