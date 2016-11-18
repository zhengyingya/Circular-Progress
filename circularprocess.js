var circularProgress = (function () {
	/**
	 * 创建canvas，将option中panelHtml插入到图表中间
	 * @protected
	 * @param {string} id 父dom id
	 * 		  {object} option 配置参数
	 */
	function createCanvas(id, option) {
		var dom = document.getElementById(id);
		dom.style.position = 'relative';
		dom.style.height = option.size + 'px';

		var divElem = document.createElement('div');
		divElem.style.width = option.size + 'px';
		divElem.style.height = option.size + 'px';
		divElem.style.margin = '0 auto';
		dom.appendChild(divElem);

		var panelDiv = document.createElement('div');
		panelDiv.innerHTML = option.panelHtml;
		panelDiv.style.width = option.size + 'px';
		panelDiv.style.height = option.size + 'px';
		panelDiv.style.display = 'table-cell';
		panelDiv.style.verticalAlign = 'middle';
		panelDiv.style.textAlign = 'center';

		var rootDiv = document.createElement('div');
		rootDiv.style.position = 'absolute';
		rootDiv.style.width = option.size + 'px';
		rootDiv.style.top = '0';
		rootDiv.style.left = '50%';
		rootDiv.style.marginLeft = '-' + option.size/2 + 'px';
		rootDiv.appendChild(panelDiv);

		dom.appendChild(rootDiv);

		var canvas = document.createElement('canvas');
		canvas.width = option.size * 2;
		canvas.height = option.size * 2;
		var angle = option.angle ? (option.angle * 360) / (2 * Math.PI) : 0;
		canvas.style.transform = 'scale(0.5) rotate(' + angle + 'deg)';
		canvas.style.marginLeft = -option.size / 2 + 'px';
		canvas.style.marginTop = -option.size / 2 + 'px';
		if (option.oppositeDirection) {
			canvas.style.transform += ' rotateY(180deg)';
		}
		divElem.appendChild(canvas);
		return canvas
	}

	/**
	 * 绘图
	 * @protected
	 * @param {string} id 父dom id
	 * 		  {object} option 配置参数
	 */
	function draw(id, option) {
		var canvas = createCanvas(id, option);
		var halfWidth = canvas.width / 2;
		var halfHeight = canvas.height / 2;
		var gradientCenter = new Point(halfWidth, halfHeight);
		var colors = option.colors ? option.colors : [[72, 190, 38, 255]];
		var blankColor = option.blankColor ? option.blankColor : [255, 255, 255, 255];

		var angularGradient = function (point) {
			// figure out angle
			var dir = point.sub(gradientCenter);
			var angle = Math.atan2(dir.y, dir.x) + Math.PI/2;
			// wrap around as positive
			if (angle < 0 ) {
				angle += 2 * Math.PI;
			}
			// map to [0, 1] range
			angle /= (option.value * 2 * Math.PI);
			// figure out which segments to interpolate
			var angleRatio = angle * (colors.length - 1);
			var index = Math.floor(angleRatio);

			var leftColor = //index == 0? colors[colors.length - 1]:
				colors[index];
			var rightColor = colors[index+1];

			if (index >= colors.length-1) {
				leftColor = blankColor;
				rightColor = blankColor;
			}

			var lerpFac = angleRatio % 1;

			return lerp(leftColor, rightColor, lerpFac);
		}
		process(canvas, option, angularGradient);

	}


	function process(canvas, option, func) {
		function setPixel(imageData, x, y, rgba) {
			var index = (x + y * imageData.width) * 4;

			for (var i = 0; i < 4; i++) {
				imageData.data[index + i] = rgba[i]// * 255;
			}
		}

		var width = canvas.width;
		var height = canvas.height;
		var rectWidth = width >= height ? width : height;
		var lineWidth = option.lineWidth ? option.lineWidth : 20;
		var outerRadius = rectWidth * 0.5 * 0.8;
		var innerRadius = rectWidth * 0.5 * 0.8 - lineWidth * 2;
		var outerRadiusSquare = Math.pow(outerRadius, 2);
		var innerRadiusSquare = Math.pow(innerRadius, 2);

		var ctx = canvas.getContext("2d");

		var imageData = ctx.createImageData(canvas.width,
			canvas.height);

		//定时绘制动画，右半圆
		var yHalf = 20;
		var y = rectWidth/2 - outerRadius;
		var timer = setInterval(function () {

			for (;y <= yHalf; y++) {
				for (var x = rectWidth / 2; x <= rectWidth/2 + outerRadius; x++) {
					var x2 = Math.pow(x - rectWidth / 2, 2);
					var y2 = Math.pow(y - rectWidth / 2, 2);
					if (x2 + y2 <= outerRadiusSquare && x2 + y2 >= innerRadiusSquare) {
						var result = func(new Point(x, y));
						setPixel(imageData, x, y, result);
					}
				}
			}

			if (yHalf === rectWidth/2 + outerRadius) {
				drawAnothonHalf ();
				clearInterval(timer);
			}
			else {
				yHalf += 20;
				ctx.putImageData(imageData, 0, 0);
				if (yHalf > rectWidth/2 + outerRadius) {
					yHalf = rectWidth/2 + outerRadius;
				}
			}
		}, 0);

		//定时绘制动画，左半圆
		function drawAnothonHalf () {
			var y = rectWidth/2 + outerRadius;
			var yAnothonHalf = rectWidth/2 + outerRadius - 20;

			var timerAnothonHalf = setInterval(function () {

				for (;y >= yAnothonHalf; y--) {
					for (var x = rectWidth / 2; x >= rectWidth/2 - outerRadius; x--) {
						var x2 = Math.pow(x - rectWidth / 2, 2);
						var y2 = Math.pow(y - rectWidth / 2, 2);
						if (x2 + y2 <= outerRadiusSquare && x2 + y2 >= innerRadiusSquare) {
							var result = func(new Point(x, y));
							setPixel(imageData, x, y, result);
						}
					}
				}

				yAnothonHalf -= 20;
				ctx.putImageData(imageData, 0, 0);

				if (yAnothonHalf < 0) {
					clearInterval(timerAnothonHalf);
				}
			}, 0);

		}

	}

	/**
	 * 计算差值颜色
	 * @protected
	 * @param {array} a 颜色1
	 * 		  {array} b 颜色2
	 * 		  {number} fac 比例[0, 1]
	 */
	function lerp(a, b, fac) {
		var ret = [];

		if(a == b) {
			return a;
		}

		for (var i = 0; i < Math.min(a.length, b.length); i++) {
			ret[i] = a[i] * (1 - fac) + b[i] * fac;
		}

		return ret;
	}

// function project(target, initial, current) {
// 	var delta = initial.sub(target);
//
// 	if( (delta.x == 0) && (delta.y == 0) ) {
// 		return target;
// 	}
//
// 	var t = current.sub(target).mul(delta).div(delta.toDistSquared());
//
// 	return delta.mul(t.x + t.y).add(target);
// }
//
//
// function dot(a, b) {
// 	return a.x * b.x + a.y * b.y;
// }
//
// function Circle(location, radius) {
// 	this.init(location, radius);
// }
// Circle.prototype = {
// 	init: function(location, radius) {
// 		this.location = location? new Point(location[0], location[1]): new Point();
// 		this.radius = radius? radius: 1;
// 	},
// 	contains: function(p) {
// 		return p.sub(this.location).toDist() <= this.radius;
// 	},
// 	intersect: function(p1, p2) {
// 		// http://local.wasp.uwa.edu.au/~pbourke/geometry/sphereline/
// 		var dp = p2.sub(p1);
// 		var a = dp.toDistSquared();
// 		var b = 2 * (dp.x * (p1.x - this.location.x) +
// 			dp.y * (p1.y - this.location.y));
// 		var c = this.location.toDistSquared() + p1.toDistSquared() - 2 *
// 			(this.location.x * p1.x + this.location.y * p1.y) -
// 			this.radius * this.radius;
//
// 		var bb4ac = b * b - 4 * a * c;
//
// 		var epsilon = 0.0001;
// 		if (Math.abs(a) < epsilon || bb4ac < 0) {
// 			return [];
// 		}
//
// 		if (bb4ac == 0) {
// 			return [p2.sub(p1).mul(-b / (2 * a)).add(p1)];
// 		}
//
// 		var mu1 = (-b + Math.sqrt(bb4ac)) / (2 * a);
// 		var mu2 = (-b - Math.sqrt(bb4ac)) / (2 * a);
//
// 		return [p2.sub(p1).mul(mu1).add(p1), p2.sub(p1).mul(mu2).add(p1)]
// 	}
// }

	function Point(x, y) {
		this.init(x, y);
	}
	Point.prototype = {
		init: function(x, y) {
			this.x = x? x: 0;
			this.y = y? y: 0;
		},
		add: function(other) {
			return this._operationTemplate(other, function(a, b) {return a + b});
		},
		sub: function(other) {
			return this._operationTemplate(other, function(a, b) {return a - b});
		},
		mul: function(other) {
			return this._operationTemplate(other, function(a, b) {return a * b});
		},
		div: function(other) {
			return this._operationTemplate(other, function(a, b) {return a / b});
		},
		ceil: function() {
			return this._operationTemplate(null, function(a) {return Math.ceil(a)});
		},
		floor: function() {
			return this._operationTemplate(null, function(a) {return Math.floor(a)});
		},
		round: function() {
			return this._operationTemplate(null, function(a) {return Math.round(a)});
		},
		_operationTemplate: function(other, op) {
			if(isNumber(other)) {
				return new Point(op(this.x, other), op(this.y, other));
			}

			if(other == null) {
				return new Point(op(this.x), op(this.y));
			}

			return new Point(op(this.x, other.x), op(this.y, other.y));
		},
		toDist: function() {
			return Math.sqrt(this.toDistSquared());
		},
		toDistSquared: function() {
			return this.x * this.x + this.y * this.y;
		},
		normalize: function() {
			return this.div(this.toDist());
		},
		invert: function() {
			return new Point(-this.x, -this.y);
		},
		closest: function(points) {
			return this._findTemplate(points,
				function() {
					return Number.MAX_VALUE;
				},
				function(dist, recordDist) {
					return dist < recordDist;
				}
			);
		},
		farthest: function(points) {
			return this._findTemplate(points,
				function() {
					return 0;
				},
				function(dist, recordDist) {
					return dist > recordDist;
				}
			);
		},
		_findTemplate: function(points, init, compare) {
			var record = init();
			var recordPoint = points[0];

			for (var i = 1; i < points.length; i++) {
				var point = points[i];
				var dist = this.sub(point).toDist();

				if (compare(dist, record)) {
					record = dist;
					recordPoint = point;
				}
			}

			return recordPoint;
		}
	}

	function isNumber(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	}

	function init(id, option) {
		draw(id, option);
	}
	return {
		draw: function (id, option) {
			init(id, option)
		}
	}
})();

module.exports = circularProgress;