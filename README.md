# strabo

The strabo library can be used for creating physical geography oriented maps for the web (or for scientific publications). It takes advantage of the 
powerful d3.js visualization library (https://d3js.org/) and the HTML canvas element (https://www.w3schools.com/html/html5_canvas.asp) for efficient handling of big raster data sets.
It aims at providing researchers with a tool to accurately and effectively visualize spatial information.

The library is divided in several modules that all depend on a basic module (the baseMap function). In the baseMap module the user
defines the map projection and extent. All other modules rely on this information to plot features and images. The style of the elements
can be partly defined using CSS rules. Style definitions will be extended in future versions. Additionally, all the modules
that use custom colors, export the color scale information that can be used by the plotColBar module (color legend).

Before we start, load the required libraries by including the following headers in your .html file 

```html
<!DOCTYPE html>

<head>
    <meta charset='utf-8'/>
    <script src='https://d3js.org/d3.v5.js'></script>
    <script src='https://d3js.org/d3-geo-projection.v2.min.js'></script>
    <script src='https://unpkg.com/topojson@3'></script>
    <script src='https://npmcdn.com/@turf/turf/turf.min.js'></script>
    <script src='strabo.js'></script>
    <title>strabo</title>
</head>
```

## Examples
### Plot georeferenced images
We will first look at how the user can plot a georeferenced image on a map. We first need to prepare the vector file that contains the world features. This file
is used by the plotBase module to plot country boundaries, coastlines and land. This file can be obtained as a shp file from http://www.naturalearthdata.com/downloads/10m-cultural-vectors.
Download the Admin 0 – Countries file and run the following commands to convert it first to geojson and then to topojson format (https://github.com/topojson/topojson).

```bash
ogr2ogr -f GeoJSON -t_srs EPSG:4326 world_10m.json ne_10m_admin_0_countries/ne_10m_admin_0_countries.shp -select admin,continent
geo2topo world_10m.json > world_10m.topojson -q 1000000
```

Notes:
1. For topo / geojson files use the standard EPSG:4326 projection to make sure that all coordinates are in WGS84 datum. D3 will take care of the reprojection  
2. The world topojson file can be directly downloaded from this repository  
3. Depending on the projection, you may need to open world_10m.topojson file with a text editor, go at the end of the file, and change 'translate':[-179.999999,-90] to 'translate':[-179.999999,-89.99999]  

Then prepare the image. I am using the gdal library for all transformations. 

```bash
# first clip the raster (it's in wgs84) to the desired extent. The one we use is the Blue Marble raster without the sea
gdalwarp -te -10 30 120 70 worldNoSea.tif worldClip.tif -overwrite
# then convert it to orthographic projection. lon_0 and lat_0 correspond to the rotation we apply
gdalwarp -wo SOURCE_EXTRA=200 -wo SAMPLE_GRID=YES -t_srs '+proj=ortho +lon_0=60 +lat_0=50 +x_0=0.0 +y_0=0 +units=m +no_defs ' worldClip.tif worldClipReproj.tif -overwrite
# finally convert it to png
gdal_translate worldClipReproj.tif world.png -of PNG -outsize 20% 20%
```

We also need to get the png center and at least one edge point in lon/lat datum. This can be done using gdalinfo. We use the following points:  
Center : [53.180775287372114, 54.90430000342316]  
Lower Left : [-0.15232519571244724, 12.344536593112801]    
Upper Right : [155.14505364913532, 32.53258732338759]  


Now in javascript:

```javascript
//define the main container
var svg = d3.select('body').append('svg')
    .attr('width', '600')
    .attr('height', '600')
    .attr('id', 'main');

//define the order of layers
svg.append('g').attr('id', 'grat')
svg.append('g').attr('id', 'land')
svg.append('g').attr('id', 'img')

var baseProj = baseMap( {container: 'main',
                       extentBounds: [[-180, -90], [179.9999, 90]],
                       projection: 'Orthographic',
                       rotate: [-50, -60, 0],
                       clAngle: 90
                    });

plotGraticule({base: baseProj, plotGratLines: true, containerLines: 'grat', stepLines: [20, 20], cssLines : 'graticuleLines',
                    plotOutline: true, containerOut: 'grat', cssOut: 'graticuleLines'
                    });

plotBase({base: baseProj, topoFile: 'world_10m.topojson', geomName: 'world_10m',
          plotLand: true, containerLand: 'land', cssLand: 'land'
        });

plotImage({container: 'img',
          base: baseProj,
          imageFile: 'worldOrtho.png',
          imgBounds: [[0.893981647301399, 7.176719648101456], [153.31851899031952, 33.24681014801683]],
          imgCenter: [53.28405275947736, 56.18783605229462],
          sphere: false
        });
```

and the css rules
```html
.land {
    fill: grey;
    fill-opacity: 0.3;
}

.graticuleLines {
    fill: none;
    stroke: lightgrey;
    stroke-width: 1;
}
```

![alt text](examples/exampl1.png?raw=true)







The same can be done in a different projection. In the following example we use the Mollweide projection, an equal-area pseudocylindrical map projection.


```bash
#reproject the world land file
gdalwarp  -wo SOURCE_EXTRA=200 -wo SAMPLE_GRID=YES -t_srs '+proj=cea +lon_0=0 +lat_ts=30 +x_0=0 +y_0=0 +units=m +no_defs ' worldClip.tif worldMollweide.tif -overwrite
#tiff to png
gdal_translate worldMollweide.tif worldMollweide.png -of PNG -outsize 20% 20%
```
Compared to the previous map, there are some changes here. First the definition of projection. Then, you can see that the image we are using has a global extent.
Because in this projection neither of the upper or lower corners of the raster can be defined in lon lat coordinates, we use two different reference points (imgBounds).
The first corresponds to the left extreme of the map, and the second to the upper extreme. We also add some text to define our graticule lines. Note that for longitude
we use a fixed interval of 40 degrees, while for the latitude we define custom text. Instead of land or coast, we now plot country boarders. 

```javascript
//define the main container
var svg = d3.select('body').append('svg')
    .attr('width', '600')
    .attr('height', '600')
    .attr('id', 'main');

//define the order of layers
svg.append('g').attr('id', 'grat')
svg.append('g').attr('id', 'land')
svg.append('g').attr('id', 'img')
svg.append('g').attr('id', 'coast')

var baseProj = baseMap( {container: 'main',
                       extentBounds: [[-180, -90], [179.9999, 90]],
                       projection: 'Mollweide',
                       rotate: [0, 0, 0],
                       clAngle: 0
                    });

plotGraticule({base: baseProj, plotGratLines: true, containerLines: 'grat', stepLines: [20, 20], cssLines : 'graticuleLines',
                    plotOutline: true, containerOut: 'grat', cssOut: 'graticuleLines',
                    plotGratText: true, containerTxt: 'gratTxt', stepTxtLon: [40], stepTxtLat: [[-40, 0, 40]], cssTxt: 'lonLatLabels', latTxtPos: -180, lonTxtPos: -60, lonOffset: 0, latOffset: -15
                    });

plotBase({base: baseProj, topoFile: 'world_10m.topojson', geomName: 'world_10m',
          plotCountries: true, containerCountries: 'coast', cssCountries: 'coast'
        });

plotImage({container: 'img',
          base: baseProj,
          imageFile: 'worldMollweide.png',
          imgBounds: [[-179.998580, -1.08], [-0.01, 83.6341]],
          imgCenter: [-0.01, -1.08],
          sphere: false
        });
```

and the css rules
```html
.coast {
    fill: none;
    stroke: lightgrey;
    stroke-width: 0.3px;
}

.graticuleLines {
    fill: none;
    stroke: lightgrey;
    stroke-width: 1;
}

.lonLatLabels {
    font-size: 11px;
    alignment-baseline: middle;
    text-anchor: middle;
    fill: black;
}
```


![alt text](examples/exampl2.png?raw=true)





... or with the Behrmann cylindrical equal area projection (standard parallels: 30°N, 30°S). The specific projection is defined using the 'parallel' attribute.
Here, we also remove the frame around the map.

```bash
# again first clip the raster (it's in wgs84) to the desired extent
#clip
gdalwarp -te -180 -20 180 20 -t_srs EPSG:4326 worldNoSea.tif worldClip.tif -overwrite
#reproject
gdalwarp  -wo SOURCE_EXTRA=200 -wo SAMPLE_GRID=YES -t_srs '+proj=cea +lon_0=0 +lat_ts=30 +x_0=0 +y_0=0 +units=m +no_defs ' worldClip.tif worldMollweide.tif -overwrite
#tiff to png
gdal_translate worldMollweide.tif worldMollweide.png -of PNG -outsize 50% 50%
```

```javascript
//define the main container
//define the main container
var svg = d3.select('body').append('svg')
    .attr('width', '600')
    .attr('height', '400')
    .attr('id', 'main');

//define the order of layers
//define the order of layers
svg.append('g').attr('id', 'grat');
svg.append('g').attr('id', 'gratTxt');
svg.append('g').attr('id', 'land');
svg.append('g').attr('id', 'img');

var baseProj = baseMap( {container: 'main',
                       extentBounds: [[-180, -90], [179.9999, 90]],
                       projection: 'CylindricalEqualArea',
                       rotate: [0, 0, 0],
                       clAngle: 0,
                       parallel: 30,
                       frame: false
                    });

plotGraticule({base: baseProj, plotGratLines: true, containerLines: 'grat', stepLines: [20, 20], cssLines : 'graticuleLines',
                    plotOutline: true, containerOut: 'grat', cssOut: 'graticuleLines',
                    plotGratText: true, containerTxt: 'gratTxt', stepTxtLon: [40], stepTxtLat: [40], cssTxt: 'lonLatLabels', latTxtPos: -180, lonTxtPos: -90, lonOffset: 10, latOffset: -15
                    });

plotBase({base: baseProj, topoFile: 'world_10m.topojson', geomName: 'world_10m',
          plotLand: true, containerLand: 'land', cssLand: 'land'
        });

plotImage({container: 'img',
          base: baseProj,
          imageFile: 'worldBehr.png',
          imgBounds: [[-180, -20], [180, 20]],
          imgCenter: [-0.0006816584381631697, 7.409997806704224e-05],
          sphere: false
        });
```

and the css rules
```html
.land {
    fill: grey;
    fill-opacity: 0.3;
}


.graticuleLines {
    fill: none;
    stroke: lightgrey;
    stroke-width: 1;
}

.lonLatLabels {
    font-size: 11px;
    alignment-baseline: middle;
    text-anchor: middle;
    fill: black;
}
```


![alt text](examples/exampl3.png?raw=true)




### Plot points on images
We can also plot simple points colored according to their attributes. In this example we combine the same image as above
in polar orthographic projection with points that represent plant populations. The points are colored according to
the altitude where the populations grow. As with the Mollweide projection, for orthographic projections at global extent the raster corners cannot be defined.
Therefore, we can tell Strabo to consider a full extent orthographic projection for the image (sphere: true).
Instead of plotting the outline of the graticule (which leaves the antimeridian clip line), we plot a circle
around the image using the sphereR (sphereR: 90) argument.

The color legend is added using promises, a javascript technique that ensures that the color legend will be added after all the points have been rendered. 

```bash
gdalwarp -te -180 0 180 90 worldNoSea.tif worldClip.tif -overwrite
gdalwarp -wo SOURCE_EXTRA=200 -wo SAMPLE_GRID=YES -t_srs '+proj=ortho +lon_0=0 +lat_0=90 +x_0=0.0 +y_0=0 +datum=WGS84 +ellps=WGS84 +units=m +no_defs' worldClip.tif worldClipReproj.tif -overwrite
gdal_translate worldClipReproj.tif world.png -of PNG -outsize 20% 20%
```

```html
.coast {
    fill: none;
    stroke: black;
    stroke-width: 0.3;
}

.graticuleLines {
    fill: none;
    stroke: lightgrey;
    stroke-width: 1;
}

.lonLatLabels {
    font-size: 14px;
    alignment-baseline: middle;
    text-anchor: middle;
    fill: grey;
}
```

```javascript
//define the main container
var svg = d3.select('body').append('svg')
    .attr('width', '600')
    .attr('height', '600')
    .attr('id', 'main');

//define the order of layers
svg.append('g').attr('id', 'grat');
svg.append('g').attr('id', 'img');
svg.append('g').attr('id', 'coast');
svg.append('g').attr('id', 'points');
svg.append('g').attr('id', 'colBar');

var baseProj = baseMap( {container: 'main',
                       extentBounds: [[-180, 0], [179.9999, 90]],
                       projection: 'Orthographic',
                       rotate: [0, -90, 0],
                       clAngle: 90.0001
                    });

plotGraticule({base: baseProj, plotGratLines: true, containerLines: 'grat', stepLines: [20, 20], cssLines : 'graticuleLines',
                    plotOutline: true, containerOut: 'grat', sphereR: 90, cssOut: 'graticuleLines',
                    plotGratText: true, containerTxt: 'gratTxt', stepTxtLon: [[-90,0,90,180]], stepTxtLat: [], cssTxt: 'lonLatLabels', latTxtPos: -160, lonTxtPos: 0, lonOffset: 10, latOffset: -15
                    });

plotBase({base: baseProj, topoFile: 'world_10m.topojson', geomName: 'world_10m',
          plotCoast: true, containerCoast: 'coast', cssCoast: 'coast'
        });

plotImage({container: 'img',
          base: baseProj,
          imageFile: 'world.png',
          imgBounds: [],
          imgCenter: [],
          sphere: true
        });

plotPoints({container : 'points',
             base: baseProj, pointFile: 'samples.csv',
             pointR: 5, 
             colorVar: 'Altitude',
             colorScale: 'Linear',
             colorRange: ['red', 'blue'],
             cssStyle: 'geoPoints'
         }).then(function(scl){
            
            plotColBar({ container: 'colBar',
                   x: 100, y: 40,
                   width: 30, height: 120, 
                   colScale: scl, 
                   nOfSections: 100, 
                   text: true, 
                   barTextDigits: 0, 
                   barTitle: 'Altitude (m a.s.l)', 
                   horizontal: false });
        });
```

![alt text](examples/exampl4.png?raw=true)





### Plot vectors
In this example, we plot Lakes of northern Europe in vector format (polygon geometries) and color them according to their rank provided by Natural Earth.
Download the respective file (http://www.naturalearthdata.com/downloads/50m-physical-vectors/50m-lakes-reservoirs/) and convert it to geojson.
The map is in Lambert Conic Conformal projection rotated at 20 longitude. We also add a scale bar.

```bash
ogr2ogr -f GeoJSON -t_srs EPSG:4326 lakes_50m.json ne_50m_lakes/ne_50m_lakes.shp
```

```html
.coast {
    fill: none;
    stroke: black;
    stroke-width: 0.3;
}

.vectorFeatures{
    fill-opacity: 0.7;
}

.graticuleLines {
    fill: none;
    stroke: lightgrey;
    stroke-width: 1;
}

.lonLatLabels {
    font-size: 14px;
    alignment-baseline: middle;
    text-anchor: middle;
    fill: black;
}

.legendTxt{
    font-size: 16px;
    fill: black;
}

.scaleBar {
    stroke: black;
    fill: black;
    stroke-width: 1px;
}
```

```javascript
//define the main container
var svg = d3.select('body').append('svg')
    .attr('width', '600')
    .attr('height', '600')
    .attr('id', 'main');

//define the order of layers
svg.append('g').attr('id', 'grat');
svg.append('g').attr('id', 'vector');
svg.append('g').attr('id', 'coast');
svg.append('g').attr('id', 'scale');
svg.append('g').attr('id', 'colBar');
svg.append('g').attr('id', 'gratTxt');

var baseProj = baseMap( {container: 'main',
                           extentBounds: [[0, 50], [40, 70]],
                           projection: 'ConicConformal',
                           rotate: [-20, 0, 0]
                        });

plotGraticule( {base: baseProj, plotGratLines: true, containerLines: 'grat', stepLines: [5, 5], cssLines: 'graticuleLines',
                    plotOutline: true, containerOut: 'grat', cssOut: 'graticuleLines',
                    plotGratText: true, containerTxt: 'gratTxt', stepTxtLon: [5], stepTxtLat: [5], cssTxt: 'lonLatLabels', latTxtPos: 0, lonTxtPos: 50, lonOffset: 10, latOffset: -15
                    });

plotScale( {container:'scale', base: baseProj, x0: 14, y0: 52, dx: 500, unit: 'km', increment: 0.0001,
            precDiff: 10, greatCircle: false, cssBar: 'scaleBar', cssTxt: 'legendTxt'} );


plotBase( {base: baseProj, topoFile: 'world_10m.topojson', geomName: 'world_10m',
          plotCoast: true, containerCoast: 'coast', cssCoast: 'coast'
        });

plotVector( {container: 'vector',
            base: baseProj,
            vectorFile: 'lakes_50m.json',
            vctFormat: 'geoJson',
            vctProperty: 'scalerank',
            colorScale: 'Ordinal',
            colorRange: ['#C6E2FF', '#7EB6FF', '#3579DC', '#0147FA', '#283A90', '#000033']
        }).then(function(scl){

            plotColBar({ container: 'colBar',
                       x: 350, y: 470,
                       width: 130, height: 20, 
                       colScale: scl, 
                       nOfSections: 100, 
                       text: true, 
                       barTextDigits: 0, 
                       barTitle: 'Rank', 
                       horizontal: true,
                       cssTxt: 'legendTxt'})
        });
```

![alt text](examples/exampl5.png?raw=true)





### Plot rasters
Raster datasets can be quite heavy for visualization programs to process. strabo utilizes the canvas element to make
this task easier for the browsers. In the following example we plot the annual mean temperature (http://chelsa-climate.org/) in Greece. The raster was obtained at
30 arc second (~1 km<sup>2</sup>) resolution. We first need to transform the tif file to json format that Javascript can read. For that, 
I use a function from the chorospy package (https://github.com/spyrostheodoridis/chorospy). The map is in Transverse Mercator projection rotated by 21 degrees (the central meridian of UTM zone 34).

```bash
# first clip the raster (use wgs84 coordoinates) to the desired extent
gdalwarp -te  15 33 30 43  -t_srs EPSG:4326 CHELSA_bio10_1.tif climClip.tif -overwrite
#transform
gdalwarp  -wo SOURCE_EXTRA=200 -wo SAMPLE_GRID=YES -t_srs '+proj=utm +zone=34 +ellps=WGS84 +datum=WGS84 +units=m +no_defs ' climClip.tif climD3.tif -overwrite
```

then in python
```python
chorospy.rasterToJSON('climD3.tif', 'climD3.json')
```

and finally in the html file

```html
.coast {
    fill: none;
    stroke: black;
    stroke-width: 0.3;
}

.graticuleLines {
    fill: none;
    stroke: lightgrey;
    stroke-width: 1;
}

.lonLatLabels {
    font-size: 14px;
    alignment-baseline: middle;
    text-anchor: middle;
    fill: black;
}

.legendTxt{
    font-size: 16px;
    fill: black;
}

.scaleBar {
    stroke: black;
    fill: black;
    stroke-width: 1px;
}
```

```javascript

//define the main container
var svg = d3.select('body').append('svg')
    .attr('width', '600')
    .attr('height', '600')
    .attr('id', 'main');

//define the order of layers
svg.append('g').attr('id', 'grat');
svg.append('g').attr('id', 'gratTxt');
svg.append('g').attr('id', 'canvas');
svg.append('g').attr('id', 'coast');
svg.append('g').attr('id', 'scale');
svg.append('g').attr('id', 'colBar');

var baseProj = baseMap( {container: 'main',
                       extentBounds: [[19, 34], [28, 42]],
                       projection: 'TransverseMercator',
                       rotate: [-21, 0, 0]
                    });

plotGraticule( {base: baseProj, plotGratLines: true, containerLines: 'grat', stepLines: [5, 5], cssLines: 'graticuleLines',
                    plotOutline: true, containerOut: 'grat', cssOut: 'graticuleLines',
                    plotGratText: true, containerTxt: 'gratTxt', stepTxt: [5,5], cssTxt: 'lonLatLabels', latTxtLon: 19, lonTxtLat: 34, lonOff: 10, latOff: -10
                    });

plotScale( {container:'scale', base: baseProj, x0: 20, y0: 35, dx: 100, unit: 'km', increment: 0.0001,
            precDiff: 5, greatCircle: false, cssBar: 'scaleBar', cssTxt: 'legendTxt'} );


plotBase( {base: baseProj, topoFile: 'world_10m.topojson', geomName: 'world_10m',
          plotCoast: true, containerCoast: 'coast', cssCoast: 'coast'
        });

var colSclImg = plotRaster({container: 'canvas', 
                           base: baseProj, 
                           rasterFile: 'climD3.json', 
                           dataScale: 10,  
                           colorScale: 'Linear', 
                           colorRange: ['blue', 'red'],
                           colorInterpolate: 'HslLong',
                           rScale: 5} );

setTimeout(function() { plotColBar({ container: 'colBar',
                                   x: 100, y: 450,
                                   width: 100, height: 20, 
                                   colScale: colSclImg, 
                                   nOfSections: 100, 
                                   barTextDigits: 0, 
                                   barTitle: 'Annual Mean Temperature (C°)', 
                                   horizontal: true,
                                   cssTxt: 'legendTxt'}); }, 1000);
```

![alt text](examples/exampl4.png?raw=true)
