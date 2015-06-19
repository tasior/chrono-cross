declare var jParser : any;

module CC {

    var drpStruct = {
        string0: function (length) { return this.parse(['string', length]).replace(/\0+$/g, ''); },
        uint24: function () { 
            var bits = [ this.parse('uint8'), this.parse('uint8'), this.parse('uint8'), 0 ];
            
            return new Uint32Array(new Uint8Array(bits).buffer)[0];  
        },
        position: function () { return this.tell(); },
        
        header: {
            magick: ['string0', 4],
            _padding: 'uint32',
            count: 'uint32',
            pointers: ['array', 'uint32', function () { return this.current.count / 64; }]
        },
        
        entry: {
            _magick: 'uint32', // 00 00 00 00
            name: ['string0', 4],
            type: 'uint8',
            length: function (argument) { return this.parse('uint24') / 16; },
            offset: 'position'
        },
        
        entries: function () {
            var header = this.current.header,
                entries = [];
            for(var i=0; i<header.pointers.length; i++) {
                this.seek(header.pointers[i]);
                entries.push(this.parse('entry'));
            }
            
            return entries;
        },
        
        drp: {
            header: 'header',
            entries: 'entries'
        }
    };

    export class DrpReader {
        
        private _buffer : ArrayBuffer;
        private _parser : any;
        private _parsed : Object;
        
        constructor(buffer : ArrayBuffer) {
            this._buffer = buffer;
            this._parser = new jParser(buffer, drpStruct);
        }
        
        read() {
            return this._parsed ? this._parsed : (this._parsed = this._parser.parse('drp'));
        }
        
        file(offset, length) {
            return this._buffer.slice(offset, offset + length);
        }
        
    }

}