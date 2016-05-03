//copy pasta

(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());


init();
animate();

function init() {

}

function animate() {
    requestAnimationFrame( animate );
    draw();
}

var doc = document.documentElement;
var nav = document.getElementsByTagName('nav')[0];

function draw() {
    if (nav) {
        var top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
        if (top <= 0) {
            nav.setAttribute('class', '');
        } else {
            nav.setAttribute('class', 'floating');
        }
    }
}