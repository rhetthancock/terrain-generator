class NoiseMap {
    constructor(detail, smoothness) {
        this.size = Math.pow(2, detail) + 1;
        this.max = this.size - 1;
        this.map = new Array(this.size * this.size);
        this.init();
        var step = this.max;
        var scale = 0.5;
        while(step / 2 >= 1) {
            var mid = step / 2;
            for(var i = 0; i < this.max; i += step) {
                for(var j = 0; j < this.max; j += step) {
                    this.diamond(i + mid, j + mid, mid, scale);
                    this.square(i + mid, j + mid, mid, scale);
                }
            }
            step = mid;
            scale = scale / smoothness;
        }
    }
    diamond(x, y, mid, scale) {
        var avg = (
            this.map[this.getIndex(x - mid, y - mid)] +
            this.map[this.getIndex(x + mid, y - mid)] +
            this.map[this.getIndex(x - mid, y + mid)] +
            this.map[this.getIndex(x + mid, y + mid)]) / 4;
        var variation = ((Math.random() * 2) - 1) * scale;
        var value = avg + variation;
        if(value > 1) {
            value = 1;
        }
        else if(value < 0) {
            value = 0;
        }
        this.map[this.getIndex(x, y)] = value;
    }
    getIndex(x, y) {
        if(x >= 0 && y >= 0 && x <= this.max && y <= this.max) {
            return y * this.size + x;
        }
    }
    init() {
        this.map[0] = Math.random();
        this.map[this.max] = Math.random();
        this.map[this.getIndex(0, this.max)] = Math.random();
        this.map[this.getIndex(this.max, this.max)] = Math.random();
    }
    set(x, y, val) {
        this.map[this.getIndex(x, y)] = val;
    }
    square(x, y, mid, scale) {
        this.square_sub(x, y - mid, mid, scale);
        this.square_sub(x + mid, y, mid, scale);
        this.square_sub(x, y + mid, mid, scale);
        this.square_sub(x - mid, y, mid, scale);
    }
    square_sub(x, y, mid, scale) {
        var avg;
        var sum = 0;
        var valid = 0;
        var top = this.map[this.getIndex(x, y - mid)];
        var right = this.map[this.getIndex(x + mid, y)];
        var bottom = this.map[this.getIndex(x, y + mid)];
        var left = this.map[this.getIndex(x - mid, y)];
        if(top != undefined) {
            sum += top;
            valid++;
        }
        if(right != undefined) {
            sum += right;
            valid++;
        }
        if(bottom != undefined) {
            sum += bottom;
            valid++;
        }
        if(left != undefined) {
            sum += left;
            valid++;
        }
        avg = sum / valid;
        var variation = ((Math.random() * 2) - 1) * scale;
        var value = avg + variation;
        if(value > 1) {
            value = 1;
        }
        else if(value < 0) {
            value = 0;
        }
        this.set(x, y, value);
    }
}