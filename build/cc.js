var CC;
(function (CC) {
    var drpStruct = {
        string0: function (length) { return this.parse(['string', length]).replace(/\0+$/g, ''); },
        uint24: function () {
            var bits = [this.parse('uint8'), this.parse('uint8'), this.parse('uint8'), 0];
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
            _magick: 'uint32',
            name: ['string0', 4],
            type: 'uint8',
            length: function (argument) { return this.parse('uint24') / 16; },
            offset: 'position'
        },
        entries: function () {
            var header = this.current.header, entries = [];
            for (var i = 0; i < header.pointers.length; i++) {
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
    var DrpReader = (function () {
        function DrpReader(buffer) {
            this._buffer = buffer;
            this._parser = new jParser(buffer, drpStruct);
        }
        DrpReader.prototype.read = function () {
            return this._parsed ? this._parsed : (this._parsed = this._parser.parse('drp'));
        };
        DrpReader.prototype.file = function (offset, length) {
            return this._buffer.slice(offset, offset + length);
        };
        return DrpReader;
    })();
    CC.DrpReader = DrpReader;
})(CC || (CC = {}));
var CC;
(function (CC) {
    /*
    01 00 00 80 - ? after loaded to ram, it is 01 00 00 00
    48 00 - number of vertex
    5E 00 - number of triangles + quads
    E0 0B 00 00 - offset to vertext pool
    28 00 00 00 - offset to uv map
    14 00 00 00 - ? offset to uv footer
    uv footer (check battle model document)
    02 00 00 00 - number of sections, see below
    34 00 - for triangles it's always 34
    30 00 - number of triangles
    28 00 00 00 - offset to triangle uv maps
    3C 00 - for quads it's always 3c
    2E 00 - number of quads
    68 05 00 00 - offset to quad uv maps
    */
    var meshStruct = {
        header: {
            magick: 'uint32',
            vertexCount: 'uint16',
            facesCount: 'uint16',
            vertexOffset: 'uint32',
            facesOffset: 'uint32',
            faceInfoOffset: 'uint32'
        },
        vertex8: {
            z: 'int16',
            y: 'int16',
            x: 'int16',
            index: 'int16'
        },
        vertices: function () {
            var header = this.current.header, vertices = [];
            this.seek(header.vertexOffset);
            for (var i = 0; i < header.vertexCount; i++) {
                vertices.push(this.parse('vertex8'));
            }
            return vertices;
        },
        facefs: {
            type: 'uint16',
            count: 'uint16',
            offset: 'uint32'
        },
        facesInfo: function () {
            this.seek(this.current.header.faceInfoOffset);
            var sections = this.parse('uint32'), facesInfo = [];
            for (var i = 0; i < sections; i++) {
                facesInfo.push(this.parse('facefs'));
            }
            return facesInfo;
        },
        // 0x34 Triangle, has vetex colors of all 3 vertices, a uv map and a list of 3 vertex indices.
        face0x34: {
            type: function () { return 0x34; },
            rgb1: ['array', 'uint8', 4],
            rgb2: ['array', 'uint8', 4],
            rgb3: ['array', 'uint8', 4],
            uv1: ['array', 'uint8', 2],
            clut: 'uint16',
            uv2: ['array', 'uint8', 2],
            tpage: 'uint16',
            uv3: ['array', 'uint8', 2],
            indices: ['array', 'uint16', 3] // P1 P1 P2 P2 P3 P3
        },
        // 0x3c Quad, has vetex colors of all 4 vertices, a uv map and a list of 4 vertex indices.
        face0x3c: {
            type: function () { return 0x3c; },
            rgb1: ['array', 'uint8', 4],
            rgb2: ['array', 'uint8', 4],
            rgb3: ['array', 'uint8', 4],
            rgb4: ['array', 'uint8', 4],
            uv1: ['array', 'uint8', 2],
            clut: 'uint16',
            uv2: ['array', 'uint8', 2],
            tpage: 'uint16',
            uv3: ['array', 'uint8', 2],
            uv4: ['array', 'uint8', 2],
            indices: ['array', 'uint16', 4]
        },
        // 0x24 Triangle, has only 1 vertex color value for all 3 vertices, a uv map and a list of 3 vertex indices.
        face0x24: {
            type: function () { return 0x24; },
            rgb: ['array', 'uint8', 4],
            uv1: ['array', 'uint8', 2],
            clut: 'uint16',
            uv2: ['array', 'uint8', 2],
            tpage: 'uint16',
            uv3: ['array', 'uint8', 2],
            indices: ['array', 'uint16', 3]
        },
        // 0x2c Quad, has only 1 vertex color value for all 4vertices, a uv map and a list of 4 vertex indices.
        face0x2c: {
            type: function () { return 0x2c; },
            rgb: ['array', 'uint8', 4],
            uv1: ['array', 'uint8', 2],
            clut: 'uint16',
            uv2: ['array', 'uint8', 2],
            tpage: 'uint16',
            uv3: ['array', 'uint8', 2],
            uv4: ['array', 'uint8', 2],
            indices: ['array', 'uint16', 4]
        },
        // 0x20 Triangle, has only 1 vertex color value (perhaps always zero and unused) , a list of 3 vertex indices, 
        // and a '00 00' at the end which makes me wonder whether it is another vertex, 
        // but it could be just a trick to make the total length a multiple of 4.
        face0x20: {
            type: function () { return 0x20; },
            rgb: ['array', 'uint8', 4],
            indices: ['array', 'uint16', 3],
            pad: 'uint16'
        },
        // 0x28 Quad, has only 1 vertex color value (perhaps always zero and unused) and a list of 4 vertex indices.
        face0x28: {
            type: function () { return 0x28; },
            rgb: ['array', 'uint8', 4],
            indices: ['array', 'uint16', 4]
        },
        // 0x30 Triangle, similar to 0x20, but has 3 vertex colors.
        face0x30: {
            type: function () { return 0x30; },
            rgb1: ['array', 'uint8', 4],
            rgb2: ['array', 'uint8', 4],
            rgb3: ['array', 'uint8', 4],
            indices: ['array', 'uint16', 3],
            pad: 'uint16'
        },
        // 0x38 Quad, similar to 0x28, but has 3 vertex colors.
        face0x38: {
            type: function () { return 0x30; },
            rgb1: ['array', 'uint8', 4],
            rgb2: ['array', 'uint8', 4],
            rgb3: ['array', 'uint8', 4],
            rgb4: ['array', 'uint8', 4],
            indices: ['array', 'uint16', 4]
        },
        faces: function () {
            var faces = [], self = this;
            for (var j = 0; j < this.current.facesInfo.length; j++) {
                var fi = this.current.facesInfo[j];
                self.seek(fi.offset);
                for (var i = 0; i < fi.count; i++) {
                    faces.push(self.parse('face0x' + fi.type.toString(16)));
                }
            }
            return faces;
        },
        mesh: {
            header: 'header',
            vertices: 'vertices',
            facesInfo: 'facesInfo',
            faces: 'faces'
        }
    };
    var MeshReader = (function () {
        function MeshReader(buffer) {
            this._buffer = buffer;
            this._parser = new jParser(buffer, meshStruct);
        }
        MeshReader.prototype.read = function () {
            return this._parsed ? this._parsed : (this._parsed = this._parser.parse('mesh'));
        };
        return MeshReader;
    })();
    CC.MeshReader = MeshReader;
})(CC || (CC = {}));
var CC;
(function (CC) {
    var Battlefield = (function () {
        function Battlefield(reader) {
            this._loaded = false;
            this._reader = reader;
        }
        Battlefield.prototype.load = function (vram) {
            if (!this._loaded) {
                this._loadTextures(vram);
                this.mesh = this._loadMeshes();
                this._loaded = true;
            }
            return this;
        };
        Battlefield.prototype._loadTextures = function (vram) {
            var _this = this;
            var drp = this._reader.read();
            drp.entries.filter(function (e) { return e.type == 0x04; }).forEach(function (entry) {
                vram.readTIM(_this._reader.file(entry.offset, entry.length));
            });
        };
        Battlefield.prototype._loadMeshes = function () {
            var _this = this;
            var drp = this._reader.read(), mesh = {};
            drp.entries.filter(function (e) { return e.type == 0x02 || e.type == 0x12; }).forEach(function (entry) {
                console.log(entry);
                var name = entry.name;
                if (mesh[entry.name]) {
                    console.warn('exist', entry.name);
                    name += Date.now();
                }
                mesh[name] = new CC.MeshReader(_this._reader.file(entry.offset, entry.length)).read();
            });
            return mesh;
        };
        return Battlefield;
    })();
    CC.Battlefield = Battlefield;
})(CC || (CC = {}));
/// <reference path="./DrpReader.ts" />
/// <reference path="./MeshReader.ts" />
/// <reference path="./Battlefield.ts" /> 
