<service singleton>
/**
* Acts like a combination of Vue.$nextTick + setTimeout() to wait until Vue has finished its processing
* @param {function} func Function to run when ready
* @param {number} [timeout=100] Delay in MS to wait before running the function
*/
module.exports = function() {
	return function $timeout(func, timeout = 100) {
		this.$nextTick(()=> setTimeout(func, timeout));
	};
};
</service>
