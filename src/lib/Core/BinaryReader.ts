/// <reference path="./Enums.ts" />


module Core {
    
    var INT8_SIZE = 1;
    var INT16_SIZE = 2;
    var INT32_SIZE = 4;
    var FLOAT32_SIZE = 4;
    var FLOAT64_SIZE = 8;
    
    export class BinaryReader {
        private _position : number = 0;
        private _view : DataView;
        
        constructor(public buffer : ArrayBuffer, public littleEndian : boolean = true) { 
            this._view = new DataView(buffer);
        }
        
        readInt8() : number {
            var position = this._position;
            this._position += INT8_SIZE;
            return this._view.getInt8(position);
        }
        readUint8() : number {
            var position = this._position;
            this._position += INT8_SIZE;
            return this._view.getUint8(position);
        }
        readInt16() : number {
            var position = this._position;
            this._position += INT16_SIZE;
            return this._view.getInt16(position, this.littleEndian);
        }
        readUint16() : number {
            var position = this._position;
            this._position += INT16_SIZE;
            return this._view.getUint16(position, this.littleEndian);
        }
        readUint24() : number {
            var bytes = new Uint8Array([ this.readUint8(), this.readUint8(), this.readUint8(), 0 ]);
            return (new DataView(bytes.buffer)).getUint32(0, this.littleEndian);
        }
        readInt24() : number {
            var bytes = new Uint8Array([ this.readUint8(), this.readUint8(), this.readUint8(), 0 ]);
            return (new DataView(bytes.buffer)).getInt32(0, this.littleEndian);
        }
        readInt32() : number {
            var position = this._position;
            this._position += INT32_SIZE;
            return this._view.getInt32(position, this.littleEndian);
        }
        readUint32() : number {
            var position = this._position;
            this._position += INT32_SIZE;
            return this._view.getUint32(position, this.littleEndian);
        }
        readFloat32() : number {
            var position = this._position;
            this._position += FLOAT32_SIZE;
            return this._view.getFloat32(position, this.littleEndian);
        }
        readFloat64() : number {
            var position = this._position;
            this._position += FLOAT32_SIZE;
            return this._view.getFloat64(position, this.littleEndian);
        }
        readString(count? : number) : string {
            var str : string = '';
            var ord : number;
            
            if(count) {
                for(; count; count--) {
                    ord = this.readUint8();
                    str += String.fromCharCode( ord == 0 ? 46 : ord );
                }
            } else {
                ord = this.readUint8();
                while(ord != 0) {
                    str += String.fromCharCode(ord);
                    
                    ord = this.readUint8();
                }
            }
            
            return str;
        }
        seek(offset, origin : SeekOrigin = SeekOrigin.Begin) {
            switch(origin) {
                case SeekOrigin.Begin:
                    this._position = offset;
                    break;
                case SeekOrigin.Current:
                    this._position += offset;
                    break;
                case SeekOrigin.End:
                    this._position = this.buffer.byteLength - offset;
                    break;
            }
        }
        pos() {
            return this._position;
        }
    }
    
}