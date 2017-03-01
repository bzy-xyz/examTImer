//
// An "exam" timer that ticks at preset intervals.
//
// Caution: not to be used as an example of sound software engineering.
//
// Copyright (c) 2017 Ben Z. Yuan <bzy@mit.edu>
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
// REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
// AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
// LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
// OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
// PERFORMANCE OF THIS SOFTWARE.
//

// Configurable parameters.

var thresholds = [
  0, 1, 2, 3, 4, 5, 10, 15, 20, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300, 360
];
var switchToSeconds = 90;
var animDurationMs = 500;


// Source code begins here...


var _ = require('lodash');
var $ = require('jquery');
var d3 = require('d3');


var doArc = d3.arc().outerRadius(400).innerRadius(300).cornerRadius(10);

var lastPieAngle = 0;
var lastPieColor = 'blue';

var trackedTimeouts = {};
var nextTimeoutID = 0;

var setTrackedTimeout = function(f, t)
{
  let timeoutID = (function(z){
    return window.setTimeout(function(){
      f();
      delete trackedTimeouts[z];
    }, t);
  })(nextTimeoutID);
  trackedTimeouts[nextTimeoutID] = timeoutID;

  let ret = nextTimeoutID;
  nextTimeoutID += 1;

  return ret;
}

var removeAllTrackedTimeouts = function(){
  _.forEach(trackedTimeouts, function(v,k){
    console.log(v);
    window.clearTimeout(v);
    delete trackedTimeouts[k];
  })
}

var setPieAngleAndColor = function setPieAngle(theta, color = null, newDisplayText = null)
{
  if(!color)
  {
    color = lastPieColor;
  }

  let path = d3.select('#pie');
  path.transition().duration(animDurationMs).attrTween('d', function(){
    return function(t) {
      let i = d3.interpolate(lastPieAngle, theta)
      return doArc({
        startAngle: 0,
        endAngle: i(t)
      });
    }
  }).attrTween('fill', function(){
    return function(t) {
      let i = d3.interpolate(lastPieColor, color)
      return i(t);
    }
  }).on('end interrupt', function(){
    lastPieAngle = theta;
    lastPieColor = color;
    $(`#countdownText`).text(newDisplayText);
  });
}


var doTick = function doTick(timeRemaining, timeTotal, displayText = null, units = null)
{

  if(!displayText)
  {
    displayText = timeRemaining;
  }

  let theta = 2 * Math.PI * (timeRemaining / timeTotal);

  if(units)
  {
    switch(units)
    {
      case 'm':
        setPieAngleAndColor(theta, 'blue', displayText);
        break;
      case 's':
        setPieAngleAndColor(theta, 'red', displayText);
        break;
    }
  }
  else
  {
    setPieAngleAndColor(theta);
  }
}

var generateTickSequence = function generateTickSequence(time)
{
  let ret = [];

    ret = _.map(
      _.filter(thresholds, function(z){return z <= _.min([switchToSeconds, time])}),
      function(t){
        return {
          time: t,
          label: t,
          units: 's'
        }
      }
    );

    if(time > switchToSeconds)
    {
      let timeMins = _.ceil(time / 60);
      ret = _.concat(ret, _.map(
        _.filter(thresholds, function(z){return z >= switchToSeconds/60 && z <= _.min([_.max(thresholds), timeMins])}),
        function(t){
          return {
            time: t * 60,
            label: t,
            units: 'm'
          }
        }
      ));
    }

  ret = _.reverse(ret);

  if(ret[0].time != time)
  {
    ret = _.concat([{
      time: time,
      label: time > switchToSeconds ? _.ceil(time / 60) : time,
      units: time > switchToSeconds ? 'm' : 's'
    }], ret);
  }

  return ret;
}


var doCountdown = function doCountdown(time)
{

  let tickSequence = generateTickSequence(time);
  _.forEach(tickSequence, function(t){
    setTrackedTimeout(function(){
      doTick(t.time, time, t.label, t.units)
    }, 1000 * (time - t.time) - animDurationMs)
  });

}

$('#startButton').click(function(){
  console.log('foo');
  if(_.toNumber($('#timerLength')[0].value)){
    $('#timerSetup').hide();
    $('#timerRunning').show();
    doCountdown(_.toNumber($('#timerLength')[0].value));
    console.log('bar');
  }
})

$('#resetButton').click(function(){
  removeAllTrackedTimeouts();
  $('#timerRunning').hide();
  $('#timerSetup').show();
})
