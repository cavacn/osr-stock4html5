(function(window){
    
    var $ = function(id){return document.getElementById(id);}
    CanvasRenderingContext2D.prototype.roundRect =
        function(x, y, width, height, radius, fill, stroke) {
            if (typeof stroke == "undefined") {
                stroke = true;
            }
            if (typeof radius === "undefined") {
                radius = 5;
            }
            this.beginPath();
            this.moveTo(x + radius, y);
            this.lineTo(x + width - radius, y);
            this.quadraticCurveTo(x + width, y, x + width, y + radius);
            this.lineTo(x + width, y + height - radius);
            this.quadraticCurveTo(x + width, y + height, x + width - radius, y+ height);
            this.lineTo(x + radius, y + height);
            this.quadraticCurveTo(x, y + height, x, y + height - radius);
            this.lineTo(x, y + radius);
            this.quadraticCurveTo(x, y, x + radius, y);
            this.closePath();
            if (stroke) {
                this.stroke();
            }
            if (fill) {
                this.fill();
            }
    };

    CanvasRenderingContext2D.prototype.dashedLineTo = function (fromX, fromY, toX, toY, pattern) {
        // default interval distance -> 5px
        if (typeof pattern === "undefined") {
            pattern = 5;
        }

        // calculate the delta x and delta y
        var dx = (toX - fromX);
        var dy = (toY - fromY);
        var distance = Math.floor(Math.sqrt(dx*dx + dy*dy));
        var dashlineInteveral = (pattern <= 0) ? distance : (distance/pattern);
        var deltay = (dy/distance) * pattern;
        var deltax = (dx/distance) * pattern;
        
        // draw dash line
        this.beginPath();
        for(var dl=0; dl<dashlineInteveral; dl++) {
            if(dl%2) {
                this.lineTo(fromX + dl*deltax, fromY + dl*deltay);
            } else {    				
                this.moveTo(fromX + dl*deltax, fromY + dl*deltay);    				
            }    			
        }
        this.stroke();
    };
    
    var Stage = function(id){
        this.root = $(id);
        this.ctx = this.root.getContext("2d");
        this.width = this.root.width;
        this.height = this.root.height;
        this.screens = {};
    }
    
    Stage.prototype.addScreen = function(name,screen){
        screen.init(stage);
        this.screens[name] = screen;
    }
    
    Stage.prototype.draw = function(name){
        if(!name){
            for(var key in this.screens){
                this.screens[key].draw();
            }
        }else{
            this.screens[name].draw();
        }
    }
    
    Stage.prototype.clear = function(name){
        if(!name){
            this.ctx.clearRect(0,0,this.width,this.height);
        }else{
            this.screens[name].clear();
        }
    }
    
    var KLineScreen = function(options){
        this.options = options || {};
        this.x = options.x * 10 % 10 == 0.5 ? options.x : options.x += 0.5;
        this.y = options.y * 10 % 10 == 0.5 ? options.y : options.y += 0.5;
        this.width = options.width;
        this.height = options.height;
        this.title = options.title;
        this.startIndex = 0;
        this.toIndex = 0;
        this.count = 0;
        this.dnumber = 5;
        this.datas = [];
        this.showDatas = [];
        this.min = 0;
        this.max = 0;
        this.nodePadding = options.nodePadding || 2;
        this.nodeWidth = options.nodeWidth || 5;
        this.lines = {};
    }
    
    KLineScreen.prototype.init = function(stage){
        this.stage = stage;
        this.ctx = stage.ctx;
        this.ctx.font = "14px 微软雅黑";
    }
    
    KLineScreen.prototype.parseX = function(x){
        var result = this.x + x;
        if(result*10 % 10 != 0.5){
            result += 0.5;
        }
        return result;
    }
    
    KLineScreen.prototype.parseY = function(y){
        return this.y + y;
        // return (this.height + this.y) - y;
    }
    
    KLineScreen.prototype.getY = function(price){
        return (this.max - price) * this.height / ( this.max - this.min );
    }
    
    KLineScreen.prototype.addLine = function(name,options){
        var _this = this;
        this.lines[name] = options;
    }
	
    KLineScreen.prototype.check = function(){
        this.datas.sort(function(a,b){
            return a.time<b.time ? -1 : 1;
        });
        this.max = 0;
        this.min = 0;
        this.count = Math.ceil( this.width / ( this.nodeWidth + this.nodePadding ) );
        if(this.startIndex < this.datas.length - this.count){
            this.startIndex = this.datas.length - this.count;
        }
        this.toIndex = this.startIndex + this.count;
        this.showDatas = [];
        for(var i = this.startIndex;i<this.toIndex;i++){
            var item = this.datas[i]
            if(item){
                if(i == this.startIndex){
                    this.max = item.high;
                    this.min = item.low;
                }else{
                    if(this.max < item.high){
                        this.max = item.high;
                    }
                    if(this.min > item.low){
                        this.min = item.low;
                    }
                }
                this.showDatas.push(item);
            }else{
                break;
            }
        }
        this.max = this.max *1.1;
        this.min = this.min/1.1;
    }
    
    KLineScreen.prototype.draw = function(){
        this.clear();
        this.check();
        this.ctx.fillStyle = "#fff";
        this.ctx.textAlign = "center";
        this.ctx.fillText(this.title,this.parseX(this.width/2),this.parseY(30));
        //这里开始画 K线图
        var needCandleRect = this.nodeWidth > 1.5;
        var _this = this;
        var dpadding = _this.width / this.dnumber;
        for(var i = 0;i<=this.dnumber;i++){
            this.ctx.strokeStyle = "#333";
            this.ctx.moveTo(this.parseX(i*dpadding),this.parseY(0));
            this.ctx.lineTo(this.parseX(i*dpadding),this.parseY(this.height));
            this.ctx.moveTo(this.parseX(0),this.parseY((this.height/this.dnumber)*i));
            this.ctx.lineTo(this.parseX(this.width),this.parseY((this.height/this.dnumber)*i));
            this.ctx.fillStyle = "#fff";
            _this.ctx.textAlign = 'left'; 
            if(i==this.dnumber){
                _this.ctx.textBaseline = 'bottom'; 
            }else{
                _this.ctx.textBaseline = 'top'; 
            }
            this.ctx.fillText((((this.max - this.min)/this.dnumber)*(this.dnumber-i)+this.min).toFixed(2),this.parseX(0),this.parseY((this.height/this.dnumber)*i));
            this.ctx.stroke();
        }
        this.ctx.strokeStyle = this.options.border || "#666";
        this.ctx.strokeRect(this.x,this.y,this.width,this.height);
        var drawKLine = function(item,index){
            var isBear = item.open > item.close;
            var color = isBear ? (_this.options.bear||'#54FFFF') : (_this.options.bull||'red');
            _this.ctx.fillStyle = color;
            _this.ctx.strokeStyle = color;
            var x = _this.parseX(index * (_this.nodePadding + _this.nodeWidth) + (_this.nodePadding + _this.nodeWidth )*.5);
            var topY = _this.parseY(_this.getY(item.high));
            var bottomY = _this.parseY(_this.getY(item.low));
            if( x < _this.parseX(0) || x+_this.nodeWidth > _this.parseX(_this.width)){
                return;
            }
            _this.ctx.beginPath();
            _this.ctx.fillStyle = color;
            _this.ctx.strokeStyle = color;
            _this.ctx.moveTo(x,topY);
            _this.ctx.lineTo(x,bottomY);
            _this.ctx.stroke();
            _this.ctx.closePath();
            var lzx = x-_this.nodeWidth*0.5;
            var lzy = _this.parseY(_this.getY(item.close));
            if(!isBear){
                _this.ctx.strokeRect(lzx,lzy,_this.nodeWidth,_this.getY(item.open)-_this.getY(item.close));
            }else{
                // _this.ctx.strokeRect(lzx,lzy,_this.nodeWidth,_this.getY(item.open)-_this.getY(item.close));
                _this.ctx.fillRect(lzx,lzy,_this.nodeWidth,_this.getY(item.open)-_this.getY(item.close));
            }
            if((x-_this.x)%dpadding<=_this.nodeWidth && index != 0){
                _this.ctx.fillStyle = "#fff";
                // _this.ctx.textBaseline = 'middle';//设置文本的垂直对齐方式
                _this.ctx.textAlign = 'center'; //设置文本的水平对对齐方式
                var time = new Date(item.time);
                var time = (time.getFullYear()+"").substr(-2)+'-'+("0"+(time.getMonth()+1)).substr(-2)+'-'+("0"+time.getDate()).substr(-2);
                _this.ctx.fillText(time,_this.parseX((index / (_this.count/_this.dnumber))*dpadding),_this.height+_this.y);
            }
            _this.ctx.stroke();
            
            //画线
            for(var key in _this.lines){
                // console.log(key,_this.lines[key]);
                var last = _this.showDatas[index-1];
                if(!last || !last[key]){
                    return;
                }
                var lx = _this.parseX((index-1) * (_this.nodePadding + _this.nodeWidth) + (_this.nodePadding + _this.nodeWidth )*.5);
                var x = _this.parseX(index * (_this.nodePadding + _this.nodeWidth) + (_this.nodePadding + _this.nodeWidth )*.5);
                var ly = _this.parseY(_this.getY(last[key]));
                var y = _this.parseY(_this.getY(item[key]));
                if(ly < _this.parseY(0) || ly > _this.parseY(_this.height) || y < _this.parseY(0) || y > _this.parseY(_this.height)){
                    return;
                }
                _this.ctx.beginPath();
                _this.ctx.strokeStyle = _this.lines[key].color || "#ff00ff";
                // _this.ctx.dashedLineTo(lx,ly,x,y,3);
                _this.ctx.moveTo(lx,ly);
                _this.ctx.lineTo(x,y);
                _this.ctx.stroke();
                _this.ctx.closePath();
            }
            
        }
        this.showDatas.forEach(drawKLine);
    }
    
    KLineScreen.prototype.clear = function(){
        this.ctx.clearRect(this.x-1,this.y-1,this.width+2,this.height+2);
    }
    
    KLineScreen.prototype.addStock = function(stock){
        this.datas.push(stock);
        this.draw();
        // console.log(this.startIndex,this.count,this.toIndex);
    }
    
	var VolumeScreen = function(options){
		this.options = options;
		this.height = options.height;
		this.width = options.width;
		this.x = options.x;
		this.y = options.y;
		this.title = options.title||"成交量";
		this.datas = [];
		this.dnumber = 2;
		this.min = 0;
		this.max = 0;
		this.count = 0;
		this.startIndex = 0;
		this.toIndex = 0;
		this.nodePadding = options.nodePadding || 2;
        this.nodeWidth = options.nodeWidth || 5;
	}
	
	VolumeScreen.prototype.init = function(stage){
		this.stage = stage;
		this.ctx = this.stage.ctx;
		this.ctx.font = "14px 微软雅黑";
	}
	
	VolumeScreen.prototype.parseX = function(x){
        var result = this.x + x;
        if(result*10 % 10 != 0.5){
            result += 0.5;
        }
        return result;
    }
    
    VolumeScreen.prototype.parseY = function(y){
        return this.y + y;
        // return (this.height + this.y) - y;
    }
	
    VolumeScreen.prototype.getY = function(volume){
        return (this.max - volume) * this.height /  (this.max - this.min);
    }
    
	VolumeScreen.prototype.clear = function(){
		this.ctx.clearRect(this.x-1,this.y-1,this.width+2,this.height+2);
	}
	
	VolumeScreen.prototype.check = function(){
		this.datas.sort(function(a,b){
            return a.time<b.time ? -1 : 1;
        });
        this.max = 0;
        this.min = 0;
        this.count = Math.ceil( this.width / ( this.nodeWidth + this.nodePadding ) );
        if(this.startIndex < this.datas.length - this.count){
            this.startIndex = this.datas.length - this.count;
        }
        this.toIndex = this.startIndex + this.count;
        this.showDatas = [];
        for(var i = this.startIndex;i<this.toIndex;i++){
            var item = this.datas[i]
            if(item){
                if(i == this.startIndex){
                    this.max = item.volume;
                    //this.min = item.volume;
                }else{
                    if(this.max < item.volume){
                        this.max = item.volume;
                    }
                    if(this.min > item.volume){
                        //this.min = item.volume;
                    }
                }
                this.showDatas.push(item);
            }else{
                break;
            }
        }
        this.max = this.max *1.05;
        //this.min = this.min/1.05;
	}
	
	VolumeScreen.prototype.draw = function(){
		this.clear();
		this.check();
		var _this = this;
        var dpadding = _this.width / this.dnumber;
        for(var i = 0;i<=this.dnumber;i++){
            this.ctx.strokeStyle = "#333";
            this.ctx.moveTo(this.parseX(i*dpadding),this.parseY(0));
            this.ctx.lineTo(this.parseX(i*dpadding),this.parseY(this.height));
            this.ctx.moveTo(this.parseX(0),this.parseY((this.height/this.dnumber)*i));
            this.ctx.lineTo(this.parseX(this.width),this.parseY((this.height/this.dnumber)*i));
            this.ctx.fillStyle = "#fff";
            _this.ctx.textAlign = 'left'; 
            if(i==this.dnumber){
                _this.ctx.textBaseline = 'bottom'; 
            }else{
                _this.ctx.textBaseline = 'top'; 
            }
            this.ctx.fillText((((this.max - this.min)/this.dnumber)*(this.dnumber-i)+this.min).toFixed(2),this.parseX(0),this.parseY((this.height/this.dnumber)*i));
            this.ctx.stroke();
        }
		
		var drawVolume = function(item,index){
			//var x = _this.parseX(index * (_this.nodePadding + _this.nodeWidth) + (_this.nodePadding + _this.nodeWidth )*.5);
			var x = _this.parseX(index * (_this.nodePadding + _this.nodeWidth) + (_this.nodePadding + _this.nodeWidth )*.5);
			var y = _this.parseY(_this.getY(item.volume));
			var isBear = item.open > item.close;
			var color = isBear ? (_this.options.bear||'#54FFFF') : (_this.options.bull||'red');
			_this.ctx.fillStyle = color;
            _this.ctx.strokeStyle = color;
			if( x < _this.parseX(0) || x+_this.nodeWidth > _this.parseX(_this.width)){
                return;
            }
			if(!isBear){
                _this.ctx.strokeRect(x,y,_this.nodeWidth,_this.parseY(_this.height)-y);
            }else{
                _this.ctx.fillRect(x,y,_this.nodeWidth,_this.parseY(_this.height)-y);
            }
		}
		
		this.showDatas.forEach(drawVolume);
	}
	
	VolumeScreen.prototype.addStock = function(stock){
		this.datas.push(stock);
		this.draw();
	}
	
    var ColorBarScreen = function(options){
        this.options = options;
		this.height = options.height;
		this.width = options.width;
		this.x = options.x;
		this.y = options.y;
		this.title = options.title||"成交量";
		this.datas = [];
		this.dnumber = 2;
		this.min = 0;
		this.max = 0;
		this.count = 0;
		this.startIndex = 0;
		this.toIndex = 0;
		this.nodePadding = options.nodePadding || 2;
        this.nodeWidth = options.nodeWidth || 5;
        this.lines = {};
        this.range = {};
    }
    
	ColorBarScreen.prototype.parseX = function(x){
        var result = this.x + x;
        if(result*10 % 10 != 0.5){
            result += 0.5;
        }
        return result;
    }
    
    ColorBarScreen.prototype.getY = function(volume){
        return (this.max - volume) * this.height /  (this.max - this.min);
    }
    
    ColorBarScreen.prototype.parseY = function(y){
        return this.y + y;
        // return (this.height + this.y) - y;
    }
	
    ColorBarScreen.prototype.init = function(stage){
		this.stage = stage;
		this.ctx = this.stage.ctx;
		this.ctx.font = "14px 微软雅黑";
	}
    
    ColorBarScreen.prototype.check = function(){
		this.datas.sort(function(a,b){
            return a.time<b.time ? -1 : 1;
        });
        this.max = 120;
        this.min = -20;
        this.count = Math.ceil( this.width / ( this.nodeWidth + this.nodePadding ) );
        if(this.startIndex < this.datas.length - this.count){
            this.startIndex = this.datas.length - this.count;
        }
        this.toIndex = this.startIndex + this.count;
        this.showDatas = [];
        for(var i = this.startIndex;i<this.toIndex;i++){
            var item = this.datas[i]
            if(item){
                this.showDatas.push(item);
            }else{
                break;
            }
        }
	}
    
    ColorBarScreen.prototype.draw = function(){
        this.clear();
        this.check();
        var _this = this;
        var dpadding = _this.width / this.dnumber;
        for(var i = 0;i<=this.dnumber;i++){
            this.ctx.strokeStyle = "#333";
            this.ctx.moveTo(this.parseX(i*dpadding),this.parseY(0));
            this.ctx.lineTo(this.parseX(i*dpadding),this.parseY(this.height));
            this.ctx.moveTo(this.parseX(0),this.parseY((this.height/this.dnumber)*i));
            this.ctx.lineTo(this.parseX(this.width),this.parseY((this.height/this.dnumber)*i));
            this.ctx.fillStyle = "#fff";
            _this.ctx.textAlign = 'left'; 
            if(i==this.dnumber){
                _this.ctx.textBaseline = 'bottom'; 
            }else{
                _this.ctx.textBaseline = 'top'; 
            }
            this.ctx.fillText((((this.max - this.min)/this.dnumber)*(this.dnumber-i)+this.min).toFixed(2),this.parseX(0),this.parseY((this.height/this.dnumber)*i));
            this.ctx.stroke();
        }
        var drawLine = function(item,index){
            var x = _this.parseX(index * (_this.nodePadding + _this.nodeWidth) + (_this.nodePadding + _this.nodeWidth )*.5);
            var y = _this.parseY(_this.getY(item.volume));
             //画线
            for(var key in _this.lines){
                // console.log(key,_this.lines[key]);
                var sub = _this.lines[key];
                var last = _this.showDatas[index-1];
                if(!last || !last[key]){
                    return;
                }
                
                if(sub.key){
                    // console.log(_this.range[sub.key]);
                    var lx = [];
                    var x = [];
                    var ly = [];
                    var y = [];
                    var fkey;
                    var skey;
                    for(var okey in _this.range[sub.key]){
                        if(!fkey){
                            fkey = okey;
                        }else{
                            skey = okey;
                        }
                        lx.push(_this.parseX((index-1)*(_this.nodeWidth+_this.nodePadding)));
                        x.push(_this.parseX(index*(_this.nodeWidth+_this.nodePadding)));
                        ly.push(_this.parseY(_this.getY(last[okey])));
                        y.push(_this.parseY(_this.getY(item[okey])));
                    }
                    _this.ctx.beginPath();
                    if(y[0] > y[1]){
                        _this.ctx.fillStyle = _this.range[sub.key][fkey].color;
                    }else{
                        _this.ctx.fillStyle = _this.range[sub.key][skey].color;
                    }
                    _this.ctx.moveTo(lx[0],ly[0]);
                    _this.ctx.lineTo(lx[1],ly[1]);
                    _this.ctx.lineTo(x[1],y[1]);
                    _this.ctx.lineTo(x[0],y[0]);
                    _this.ctx.fill();
                    _this.ctx.closePath();
                }else{
                    var lx = _this.parseX((index-1) * (_this.nodePadding + _this.nodeWidth) + (_this.nodePadding + _this.nodeWidth )*.5);
                    var x = _this.parseX(index * (_this.nodePadding + _this.nodeWidth) + (_this.nodePadding + _this.nodeWidth )*.5);
                    var ly = _this.parseY(_this.getY(last[key]));
                    var y = _this.parseY(_this.getY(item[key]));
                    if(ly < _this.parseY(0) || ly > _this.parseY(_this.height) || y < _this.parseY(0) || y > _this.parseY(_this.height)){
                        return;
                    }
                    _this.ctx.beginPath();
                    _this.ctx.strokeStyle = sub.color || "#ff00ff";
                    // _this.ctx.dashedLineTo(lx,ly,x,y,3);
                    _this.ctx.moveTo(lx,ly);
                    _this.ctx.lineTo(x,y);
                    _this.ctx.stroke();
                    _this.ctx.closePath();
                }
            }
        }
        
        this.showDatas.forEach(drawLine);
    }
    
    ColorBarScreen.prototype.addStock = function(stock){
		this.datas.push(stock);
		this.draw();
	}
    
    ColorBarScreen.prototype.clear = function(){
		this.ctx.clearRect(this.x-1,this.y-1,this.width+2,this.height+2);
	}
    
    ColorBarScreen.prototype.addLine = function(name,opts){
        this.lines[name] = opts;
        if(opts.key){
            if(!this.range[opts.key]){
                this.range[opts.key] = {};
            }
            this.range[opts.key][name] = opts;
        }
    }
    
    var TipsScreen = function(opts,stage){
        this.root = document.createElement("div");
        this.root.style = "position:absolute;";
    }
    
    TipsScreen.prototype.init = function(stage){
        this.stage = stage;
    }
    
    window.Stage = Stage;
    
    window.KLineScreen = KLineScreen;
	
	window.VolumeScreen = VolumeScreen;
    
    window.ColorBarScreen = ColorBarScreen;
    
    window.TipsScreen = TipsScreen;
    
})(window)