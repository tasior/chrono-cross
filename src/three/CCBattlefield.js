/* global THREE */


THREE.CCBattlefield = function ( battlefield, vram ) {
    THREE.Group.call( this );
    
    this.battlefield = battlefield.load(vram);
    this.vram = vram;
    this.textures = [];
    this.texturesIds = {};
    this.materials = [];
    
    for(var m in this.battlefield.mesh) {
        var ccMesh = this.battlefield.mesh[m];
        this.add( this._createMesh(ccMesh, m) );
    }
};

THREE.CCBattlefield.prototype = Object.create( THREE.Group.prototype );
THREE.CCBattlefield.prototype.constructor = THREE.CCBattlefield;

THREE.CCBattlefield.prototype._createMesh = function (ccMesh, name) {
    var geometry = new THREE.Geometry();
    var self = this;
    var materials = [];
    
    ccMesh.vertices.forEach(function (v) {
        geometry.vertices.push( new THREE.Vector3(v.x / 100, -v.y / 100, v.z / 100) );
    });
    
    ccMesh.faces.forEach(function (f) {
        
        switch (f.type) {
            // #define GPU_COM_F3    0x20
            case 0x20: //triangle, no texture
                var color = new THREE.Color( f.rgb[0], f.rgb[1], f.rgb[2] );
                geometry.faces.push( new THREE.Face3( f.indices[0], f.indices[1], f.indices[2], undefined, color, 0 ) );
                geometry.faceVertexUvs[ 0 ].push([
                    new THREE.Vector2( 0, 0 ),
                    new THREE.Vector2( 0, 0 ),
                    new THREE.Vector2( 0, 0 )
                ]);
                break;
            // #define GPU_COM_TF3   0x24
            case 0x24: //triangle, texture
                var textureIndex = self._getMaterialIndex(f.tpage, f.clut);
                var color = new THREE.Color( f.rgb[0], f.rgb[1], f.rgb[2] );
                geometry.faces.push( new THREE.Face3( f.indices[0], f.indices[1], f.indices[2], undefined, color, textureIndex ) );
                geometry.faceVertexUvs[ 0 ].push([
                    new THREE.Vector2( f.uv3[0] / 256, (256 - f.uv3[1]) / 256 ),
                    new THREE.Vector2( f.uv1[0] / 256, (256 - f.uv1[1]) / 256 ),
                    new THREE.Vector2( f.uv2[0] / 256, (256 - f.uv2[1]) / 256 ),
                ]);
                break;
            // #define GPU_COM_G3    0x30
            case 0x30: //triangle, no texture
                var color = [
                    new THREE.Color( f.rgb1[0], f.rgb1[1], f.rgb1[2] ),
                    new THREE.Color( f.rgb2[0], f.rgb2[1], f.rgb2[2] ),
                    new THREE.Color( f.rgb3[0], f.rgb3[1], f.rgb3[2] )
                ];
                geometry.faces.push( new THREE.Face3( f.indices[0], f.indices[1], f.indices[2], undefined, color, 0 ) );
                geometry.faceVertexUvs[ 0 ].push([
                    new THREE.Vector2( 0, 0 ),
                    new THREE.Vector2( 0, 0 ),
                    new THREE.Vector2( 0, 0 )
                ]);
                break;
            // #define GPU_COM_TG3   0x34
            case 0x34: //triangle, texture
                var textureIndex = self._getMaterialIndex(f.tpage, f.clut);
                var color = [
                    new THREE.Color( f.rgb1[0], f.rgb1[1], f.rgb1[2] ),
                    new THREE.Color( f.rgb2[0], f.rgb2[1], f.rgb2[2] ),
                    new THREE.Color( f.rgb3[0], f.rgb3[1], f.rgb3[2] )
                ];
                geometry.faces.push( new THREE.Face3( f.indices[0], f.indices[1], f.indices[2], undefined, color, textureIndex ) );
                geometry.faceVertexUvs[ 0 ].push([
                    /*********
                     * CHECK WTF!!!????
                    *********/
                    new THREE.Vector2( f.uv3[0] / 256, (256 - f.uv3[1]) / 256 ),
                    new THREE.Vector2( f.uv1[0] / 256, (256 - f.uv1[1]) / 256 ),
                    new THREE.Vector2( f.uv2[0] / 256, (256 - f.uv2[1]) / 256 ),
                ]);
                break;
            // #define GPU_COM_F4    0x28
            case 0x28: // quad, no texture
                var color = new THREE.Color( f.rgb[0], f.rgb[1], f.rgb[2] );
                geometry.faces.push( new THREE.Face3( f.indices[0], f.indices[1], f.indices[2], undefined, color, 0 ) );
                geometry.faceVertexUvs[ 0 ].push([
                    new THREE.Vector2( 0, 0 ),
                    new THREE.Vector2( 0, 0 ),
                    new THREE.Vector2( 0, 0 )
                ]);
                geometry.faces.push( new THREE.Face3( f.indices[3], f.indices[2], f.indices[1], undefined, color, 0 ) );
                geometry.faceVertexUvs[ 0 ].push([
                    new THREE.Vector2( 0, 0 ),
                    new THREE.Vector2( 0, 0 ),
                    new THREE.Vector2( 0, 0 )
                ]);
                break;
            // #define GPU_COM_TF4   0x2c
            case 0x2c: // quad, texture
                var textureIndex = self._getMaterialIndex(f.tpage, f.clut);
                var color = new THREE.Color( f.rgb[0], f.rgb[1], f.rgb[2] );
                geometry.faces.push( new THREE.Face3( f.indices[0], f.indices[1], f.indices[2], undefined, color, textureIndex ) );
                geometry.faceVertexUvs[ 0 ].push([
                    new THREE.Vector2( f.uv1[0] / 256, (256 - f.uv1[1]) / 256  ),
                    new THREE.Vector2( f.uv2[0] / 256, (256 - f.uv2[1]) / 256  ),
                    new THREE.Vector2( f.uv3[0] / 256, (256 - f.uv3[1]) / 256  )
                ]);
                geometry.faces.push( new THREE.Face3( f.indices[3], f.indices[2], f.indices[1], undefined, color, textureIndex ) );
                geometry.faceVertexUvs[ 0 ].push([
                    new THREE.Vector2( f.uv4[0] / 256, (256 - f.uv4[1]) / 256  ),
                    new THREE.Vector2( f.uv3[0] / 256, (256 - f.uv3[1]) / 256  ),
                    new THREE.Vector2( f.uv2[0] / 256, (256 - f.uv2[1]) / 256  )
                ]);
                break;
            // #define GPU_COM_G4    0x38
            case 0x38: // quad, no textures
                var color = [
                    new THREE.Color( f.rgb1[0], f.rgb1[1], f.rgb1[2] ),
                    new THREE.Color( f.rgb2[0], f.rgb2[1], f.rgb2[2] ),
                    new THREE.Color( f.rgb3[0], f.rgb3[1], f.rgb3[2] )
                ];
                geometry.faces.push( new THREE.Face3( f.indices[0], f.indices[1], f.indices[2], undefined, color, 0 ) );
                geometry.faceVertexUvs[ 0 ].push([
                    new THREE.Vector2( 0, 0 ),
                    new THREE.Vector2( 0, 0 ),
                    new THREE.Vector2( 0, 0 )
                ]);
                var color = [
                    new THREE.Color( f.rgb4[0], f.rgb4[1], f.rgb4[2] ),
                    new THREE.Color( f.rgb3[0], f.rgb3[1], f.rgb3[2] ),
                    new THREE.Color( f.rgb2[0], f.rgb2[1], f.rgb2[2] )
                ];
                geometry.faces.push( new THREE.Face3( f.indices[3], f.indices[2], f.indices[1], undefined, color, 0 ) );
                geometry.faceVertexUvs[ 0 ].push([
                    new THREE.Vector2( 0, 0 ),
                    new THREE.Vector2( 0, 0 ),
                    new THREE.Vector2( 0, 0 )
                ]);
                break;
            // #define GPU_COM_TG4   0x3c
            case 0x3c: // quad, texture
                var textureIndex = self._getMaterialIndex(f.tpage, f.clut);
                var color = [
                    new THREE.Color( f.rgb1[0], f.rgb1[1], f.rgb1[2] ),
                    new THREE.Color( f.rgb2[0], f.rgb2[1], f.rgb2[2] ),
                    new THREE.Color( f.rgb3[0], f.rgb3[1], f.rgb3[2] )
                ];
                geometry.faces.push( new THREE.Face3( f.indices[0], f.indices[1], f.indices[2], undefined, color, textureIndex ) );
                geometry.faceVertexUvs[ 0 ].push([
                    new THREE.Vector2( f.uv1[0] / 256, (256 - f.uv1[1]) / 256  ),
                    new THREE.Vector2( f.uv2[0] / 256, (256 - f.uv2[1]) / 256  ),
                    new THREE.Vector2( f.uv3[0] / 256, (256 - f.uv3[1]) / 256  )
                ]);
                var color = [
                    new THREE.Color( f.rgb4[0], f.rgb4[1], f.rgb4[2] ),
                    new THREE.Color( f.rgb3[0], f.rgb3[1], f.rgb3[2] ),
                    new THREE.Color( f.rgb2[0], f.rgb2[1], f.rgb2[2] )
                ];
                geometry.faces.push( new THREE.Face3( f.indices[3], f.indices[2], f.indices[1], undefined, color, textureIndex ) );
                geometry.faceVertexUvs[ 0 ].push([
                    new THREE.Vector2( f.uv4[0] / 256, (256 - f.uv4[1]) / 256  ),
                    new THREE.Vector2( f.uv3[0] / 256, (256 - f.uv3[1]) / 256  ),
                    new THREE.Vector2( f.uv2[0] / 256, (256 - f.uv2[1]) / 256  )
                ]);
                break;
        }
    });
    
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    
    // var mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide } ) );
    // var mesh = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial({color: 0xababab, side: THREE.DoubleSide}) );
    var mesh = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( this.textures ) );
    mesh.name = name;
    
    return mesh;
};

THREE.CCBattlefield.prototype._getMaterialIndex = function (tpage, clut) {
    var tid = tpage + '_' + clut;
    var self = this;
    
    if(!this.texturesIds[tid]) {
        this.texturesIds[tid] = this.textures.length;
        var material = new THREE.MeshBasicMaterial( { 
                map: self._createTexture( tpage, clut ), 
                transparent: true, 
                alphaTest: 0.1,
                side: THREE.DoubleSide
            } );
            
        var blendings = [ "NoBlending", "NormalBlending", "AdditiveBlending", "SubtractiveBlending", "MultiplyBlending", "AdditiveAlphaBlending" ];

		var src = [ "ZeroFactor", "OneFactor", "SrcAlphaFactor", "OneMinusSrcAlphaFactor", "DstAlphaFactor", "OneMinusDstAlphaFactor", "DstColorFactor", "OneMinusDstColorFactor", "SrcAlphaSaturateFactor" ];
		var dst = [ "ZeroFactor", "OneFactor", "SrcColorFactor", "OneMinusSrcColorFactor", "SrcAlphaFactor", "OneMinusSrcAlphaFactor", "DstAlphaFactor", "OneMinusDstAlphaFactor" ];
        
        if((((tpage)>>5)&0x003)) {
            console.log((((tpage)>>5)&0x003));
            material.abr = 1;
//             material.blending = THREE[ 'CustomBlending' ];
// 			material.blendSrc = THREE[ 'DstColorFactor' ];
// 			material.blendDst = THREE[ 'OneFactor' ];
// 			material.blendEquation = THREE.AddEquation;
        } else {
            material.abr = 0;
            material.transparent = false;
        }
        
        this.textures.push( material );
    }
    
    return this.texturesIds[tid];
};

THREE.CCBattlefield.prototype._createTexture = function (tpage, clut) {
    var data = new Uint8Array( 4 * 256 * 256 );
    var material = this.vram.loadImage2(tpage, clut);

    var color;
    for(var i = 0; i < material.data.length; i++) {
        color = this.vram.toRgba(material.data[i]);
		
        data[ i * 4 ] = color.r;
        data[ i * 4 + 1 ] = color.g;
        data[ i * 4 + 2 ] = color.b;
        data[ i * 4 + 3 ] = color.a;
    }
    
    var texture = new THREE.DataTexture( 
        /*data*/ data, 
        /*width*/material.w, 
        /*height*/material.h, 
        /*format*/THREE.RGBAFormat, 
        /*type*/ undefined, 
        /*mapping*/ undefined, 
        /*wrapS*/ undefined, 
        /*wrapT*/ undefined, 
        /*magFilter*/ THREE.NearestFilter, 
        /*minFilter*/ THREE.NearestFilter, 
        /*anisotropy*/ undefined
    );
    texture.needsUpdate = true;
        
    
    return texture;
};