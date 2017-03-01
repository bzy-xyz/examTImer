ALL: timer

timer: timer_main.js
	browserify -o timer.js timer_main.js
