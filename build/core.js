var Core;
(function (Core) {
    (function (SeekOrigin) {
        SeekOrigin[SeekOrigin["Begin"] = 1] = "Begin";
        SeekOrigin[SeekOrigin["Current"] = 2] = "Current";
        SeekOrigin[SeekOrigin["End"] = 3] = "End";
    })(Core.SeekOrigin || (Core.SeekOrigin = {}));
    var SeekOrigin = Core.SeekOrigin;
})(Core || (Core = {}));
/// <reference path="./Enums.ts" />
var Core;
(function (Core) {
    var INT8_SIZE = 1;
    var INT16_SIZE = 2;
    var INT32_SIZE = 4;
    var FLOAT32_SIZE = 4;
    var FLOAT64_SIZE = 8;
    var BinaryReader = (function () {
        function BinaryReader(buffer, littleEndian) {
            if (littleEndian === void 0) { littleEndian = true; }
            this.buffer = buffer;
            this.littleEndian = littleEndian;
            this._position = 0;
            this._view = new DataView(buffer);
        }
        BinaryReader.prototype.readInt8 = function () {
            var position = this._position;
            this._position += INT8_SIZE;
            return this._view.getInt8(position);
        };
        BinaryReader.prototype.readUint8 = function () {
            var position = this._position;
            this._position += INT8_SIZE;
            return this._view.getUint8(position);
        };
        BinaryReader.prototype.readInt16 = function () {
            var position = this._position;
            this._position += INT16_SIZE;
            return this._view.getInt16(position, this.littleEndian);
        };
        BinaryReader.prototype.readUint16 = function () {
            var position = this._position;
            this._position += INT16_SIZE;
            return this._view.getUint16(position, this.littleEndian);
        };
        BinaryReader.prototype.readUint24 = function () {
            var bytes = new Uint8Array([this.readUint8(), this.readUint8(), this.readUint8(), 0]);
            return (new DataView(bytes.buffer)).getUint32(0, this.littleEndian);
        };
        BinaryReader.prototype.readInt24 = function () {
            var bytes = new Uint8Array([this.readUint8(), this.readUint8(), this.readUint8(), 0]);
            return (new DataView(bytes.buffer)).getInt32(0, this.littleEndian);
        };
        BinaryReader.prototype.readInt32 = function () {
            var position = this._position;
            this._position += INT32_SIZE;
            return this._view.getInt32(position, this.littleEndian);
        };
        BinaryReader.prototype.readUint32 = function () {
            var position = this._position;
            this._position += INT32_SIZE;
            return this._view.getUint32(position, this.littleEndian);
        };
        BinaryReader.prototype.readFloat32 = function () {
            var position = this._position;
            this._position += FLOAT32_SIZE;
            return this._view.getFloat32(position, this.littleEndian);
        };
        BinaryReader.prototype.readFloat64 = function () {
            var position = this._position;
            this._position += FLOAT32_SIZE;
            return this._view.getFloat64(position, this.littleEndian);
        };
        BinaryReader.prototype.readString = function (count) {
            var str = '';
            var ord;
            if (count) {
                for (; count; count--) {
                    ord = this.readUint8();
                    str += String.fromCharCode(ord == 0 ? 46 : ord);
                }
            }
            else {
                ord = this.readUint8();
                while (ord != 0) {
                    str += String.fromCharCode(ord);
                    ord = this.readUint8();
                }
            }
            return str;
        };
        BinaryReader.prototype.seek = function (offset, origin) {
            if (origin === void 0) { origin = Core.SeekOrigin.Begin; }
            switch (origin) {
                case Core.SeekOrigin.Begin:
                    this._position = offset;
                    break;
                case Core.SeekOrigin.Current:
                    this._position += offset;
                    break;
                case Core.SeekOrigin.End:
                    this._position = this.buffer.byteLength - offset;
                    break;
            }
        };
        BinaryReader.prototype.pos = function () {
            return this._position;
        };
        return BinaryReader;
    })();
    Core.BinaryReader = BinaryReader;
})(Core || (Core = {}));
var Core;
(function (Core) {
    var BinaryFileReader = (function () {
        function BinaryFileReader(file) {
            this.file = file;
        }
        BinaryFileReader.prototype.read = function (offset, length, callback) {
            var fileReader = new FileReader();
            fileReader.onloadend = function (event) {
                callback(event.target.result);
            };
            fileReader.readAsArrayBuffer(this.file.slice(offset, offset + length));
        };
        return BinaryFileReader;
    })();
    Core.BinaryFileReader = BinaryFileReader;
})(Core || (Core = {}));
var Core;
(function (Core) {
    var FileDialog = (function () {
        function FileDialog() {
            this._input = document.createElement('input');
            this._input.setAttribute('type', 'file');
        }
        FileDialog.prototype.open = function (callback) {
            this._input.onchange = function (event) {
                event.preventDefault();
                callback(event.target.files[0]);
            };
            this._input.click();
        };
        return FileDialog;
    })();
    Core.FileDialog = FileDialog;
})(Core || (Core = {}));
/// <reference path="./Enums.ts" />
/// <reference path="./BinaryReader.ts" />
/// <reference path="./BinaryFileReader.ts" />
/// <reference path="./FileDialog.ts" /> 
