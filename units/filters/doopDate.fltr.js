/**
* Override the `date` filter to work properly
*/
angular
	.module('app')
	.filter('doopDate', function() {
		var formats = {
			default: 'D/MM/YY HH:mm',
			short: 'D/MM/YY HH:mm',
			long: 'MMM d, YYYY h:mm:ss a',
			reverse: 'YYYY-MM-DD',
			full: 'YYYY-MM-DD HH:mm:ss',
			iso: 'YYYY-MM-DDThh:mm:ssZZ',
			fullDate: 'dddd MMMM D YYYY',
		};

		return function(value, format) {
			if (!value) return;

			if (format === undefined) {
				return moment(value).format(formats['default']);
			} else if (!formats[format]) {
				throw new Error('Unknown date format: "' + format + '". If you believe this is an error update the custom date filter to include your custom output format');
			} else {
				return moment(value).format(formats[format]);
			}
		};
	})