# CircularProgress

用canvas实现颜色渐变圆形的进度条，与一般的渐变圆形进度条不一样，可以实现两头颜色固定，直接上图

![image](https://github.com/zhengyingya/Circular-Progress/raw/master/img/1.png)![image](https://github.com/zhengyingya/Circular-Progress/raw/master/img/2.png)![image](https://github.com/zhengyingya/Circular-Progress/raw/master/img/3.png)![image](https://github.com/zhengyingya/Circular-Progress/raw/master/img/4.png)

#### 配置

| key | explain | example |
|----|------|----|
|value| 进度值 |0.5|
|colors | 渐变颜色值，rgba格式 |[[202, 239, 72, 255], [72, 190, 38, 255]]|
|size | 图的大小 |200|
|lineWidth | 圆环的宽度 |20|
|angle | 旋转角度 |0.5*MATH.PI|
|blankColor |圆环其它地方颜色值 |[237, 247, 233, 255]|
|panelHtml |图中央显示文本，以html字符串形式传入|\<div class="text2">已激活\</div>|
|oppositeDirection|是否反方向绘制，默认false|true|

#### 示例


```javascript
var circularProgress = require('./circularprocess');

circularProgress.draw('attendance-circle', {
	value: res.data.percentOfAttendance,
	colors: [[202, 239, 72, 255], [72, 190, 38, 255]],
	blankColor: [237, 247, 233, 255],
	size: 250,
	lineWidth: 10,
	angle: 0,
	panelHtml: '<div>example</div>'
});
```
