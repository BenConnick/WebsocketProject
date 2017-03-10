// functions for visual effects
var effectsManager = {
	hitMarkers: [],
	sparks: [],
	addHitMarker: function(num, pos, color) {
		this.hitMarkers.push(new HitMarker(num, pos, 1000, color));
	},
	addSpark: function(pos, color) {
		this.sparks.push(new Spark(pos,1000,color));
	},
	updateAll: function() {
		for (var i=this.hitMarkers.length-1; i>-1; i--) {
			if (this.hitMarkers[i].checkExpiry() == "expired")
				this.hitMarkers.splice(i,1);
		}
		for (var i=this.sparks.length-1; i>-1; i--) {
			if (this.sparks[i].checkExpiry() == "expired")
				this.sparks.splice(i,1);
		}
	},
	drawAll: function(ctx) {
		this.hitMarkers.forEach(function(hm) {
			hm.draw(ctx);
		});
		this.sparks.forEach(function(s) {
			s.draw(ctx);
		});
		
	}
};

function HitMarker(num, pos, lifetime, color, multiplier) {
	this.color = color || "red";
	this.num = num;
	this.pos = pos;
	this.startTime = Date.now();
	this.lifetime = lifetime;
	this.offset = { x: Math.random()*5, y: Math.random()*10 };
	this.checkExpiry = function() {
		//console.log("killTime: "+(this.startTime + this.lifetime));
		//console.log("currentTime: "+Date.now());
		if (Date.now() > this.startTime + this.lifetime) return "expired";
	};
	
	if (multiplier) {
		// bubble text
		this.txt = "x"+this.num;
	} else {
		// bubble text
		this.txt = "-"+this.num;
		// check for whiff
		if (this.num == 0) this.txt = "miss";
		// check for HP potion
		if (this.num < 0) {
			var posNum = -1*this.num;
			this.txt = "+"+posNum;
		}
	}
	
	this.draw = function(ctx) {
		var percent = (this.startTime + this.lifetime - Date.now())/this.lifetime;
		ctx.save();
		// fade out
		ctx.globalAlpha = percent;
		// background
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(pos.x + this.offset.x + percent*5 + 7,pos.y + this.offset.y + percent*5 - 5,15,0,2*Math.PI);
		ctx.closePath();
		ctx.fill();
		// red
		ctx.fillStyle = "white";
		// draw and slowly drift away
		ctx.font="12px Verdana";
		ctx.fillText(this.txt,pos.x + this.offset.x + percent*5,pos.y + this.offset.y + percent*5);
		// reset
		ctx.restore();
	}
};

function Spark(pos, lifeTime, color) {
	
	this.checkExpiry = function() {
		//console.log("killTime: "+(this.startTime + this.lifetime));
		//console.log("currentTime: "+Date.now());
		if (Date.now() > this.startTime + this.lifetime) return "expired";
	};
	
	this.pos = pos;
	this.startTime = Date.now();
	this.lifetime = lifeTime;
	
	if (color) {
		this.color = color;
	} else {
		this.color = "#55f";
	}

	this.draw = function(ctx) {
		// percent of life
		var percent = (this.startTime + this.lifetime - Date.now())/this.lifetime;
		
		// contain draw
		ctx.save();
		// fade out
		ctx.globalAlpha = percent;
		// color
		ctx.fillStyle = this.color;
		// pos
		ctx.translate(this.pos.x + percent*5 + 7,this.pos.y + percent*5 - 5);
		// rotate
		ctx.rotate(percent*2*Math.PI);
		// scale 
		ctx.scale(1+2*percent,1+2*percent);
		// draw 4 pointed star
		ctx.beginPath();
		ctx.moveTo(0,15);
		ctx.lineTo(5,5);
		ctx.lineTo(15,0);
		ctx.lineTo(5,-5);
		ctx.lineTo(0,-15);
		ctx.lineTo(-5,-5);
		ctx.lineTo(-15,0);
		ctx.lineTo(-5,5);
		ctx.closePath();
		// fill
		ctx.fill();
		// reset context
		ctx.restore();
	}
	
}