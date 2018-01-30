# anaximander

Anaximander: one of the first Greek philosophers to work on the fields of what we now call geography and biology.

The anaximander library can be used for creating physical geography oriented maps for the web (or for scientific publications). The module is written in Javascript. It takes advantage of the 
powerful d3.js visualization library (https://d3js.org/) and the HTML canvas element (https://www.w3schools.com/html/html5_canvas.asp) for efficient handling of big raster data sets.
It aims at providing researchers with a tool to accurately and effectively visualize spatial information.

The library is divided in several modules that all depend on a basic module (the baseMap function). In the baseMap module the user
defines the map projection and extent. All other modules rely on this information to plot features and images. The style of the elements
can be partly defined using CSS rules. Style definitions will be extended in future versions. Additionally, all the modules
that use custom colors, export the color scale information that can be used by the plotColBar module (color legend).

Before we start, download the required libraries and include the following headers in your .html file 

```html
<!DOCTYPE html>

<head>
    <meta charset="utf-8"/>
    <script src="js/d3.v4.min.js"></script> 
    <script src="js/d3-geo-projection.v2.min.js"></script>
    <script src="js/topojson.v2.min.js"></script>
    <script src="js/turf.min.js"></script>
    <script src="anaximander.js"></script>
    <title>Anaximander</title>
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
3. Depending on the projection, you may need to open world_10m.topojson file with a text editor, go at the end of the file, and change "translate":[-179.999999,-90] to "translate":[-179.999999,-89.99999]  

Then prepare the image. I am using the gdal library for all transformations. 

```bash
# first clip the raster (it's in wgs84) to the desired extent. The one we use is the Blue Marble raster without the sea
gdalwarp -te -10 30 120 70 worldMarbleNoWater.tif short.tif -overwrite
# then convert it to orthographic projection. lon_0 and lat_0 correspond to the rotation we apply
gdalwarp -wo SOURCE_EXTRA=200 -wo SAMPLE_GRID=YES -t_srs '+proj=ortho +lon_0=60 +lat_0=50 +x_0=0.0 +y_0=0 +units=m +no_defs ' short.tif shortOrtho.tif -overwrite
# finally convert it to png
gdal_translate shortOrtho.tif world.png -of PNG -outsize 20% 20%
```

We also need to get the png center and at least one edge point in lon/lat datum. This can be done using gdalinfo. We use the following points:  
Center : [53.180775287372114, 54.90430000342316]  
Lower Left : [-0.15232519571244724, 12.344536593112801]    
Upper Right : [155.14505364913532, 32.53258732338759]  


Now in javascript:

```javascript
//define the main container
var svg = d3.select("body").append("svg")
    .attr("width", '600')
    .attr("height", '600')
    .attr("id", "main");

//define the order of layers
svg.append('g').attr('id', 'grat')
svg.append('g').attr('id', 'land')
svg.append('g').attr('id', 'img')

var baseProj = baseMap(container = 'main',
                       projection = 'Orthographic',
                       rotate = [-50, -50, 0],
                       clAngle = 90, 
                       extentBounds = [[-180, -90], [179.9999, 90]]);

plotGraticule(container = 'grat',
              base = baseProj,
              step = [20, 20],
              plotGratLines = true,
              plotOutline = true,
              sphereR = 0,
              plotGratText = false,
              cssStyle = 'graticuleLines');

plotBase(container ='land',
         base = baseProj, topoFile = 'world_10m.topojson',
         geomName = 'world_10m',
         plotCoast = false,
         plotLand = true,
         plotCountries = false,
         cssStyle = 'land');

plotImage(container = 'img',
          base = baseProj,
          imageFile = 'world.png',
          imgBounds = [[-0.15232519571244724, 12.344536593112801], [155.14505364913532, 32.53258732338759]],
          imgCenter = [53.180775287372114, 54.90430000342316],
          sphere = false)
```

And the two CSS rules

```html
.land {
    fill: grey;
    fill-opacity: 0.3;

.graticuleLines {
    fill: none;
    stroke: grey;
    stroke-width: 0.5;
}
```

![alt text](examples/exampl1.png?raw=true)

### Plot points on images
We can also plot simple points colored according to their attributes. In this example we combine the same image as above
in polar orthographic projection (sphere = true) with points that represent plant populations. The points are colored according to
the altitude where the populations leave. In the case of full extent orthographic projections no imgBounds are necessary (actually they are not defined!)
We also add the coastline. Instead of plotting the outline of the graticule (which leaves the antimeridian clip line), we plot a circle
around the image using the sphereR (radius = 90 degrees) argument.

```bash
gdalwarp -te -180 0 180 90 worldMarbleNoWater.tif short.tif -overwrite
gdalwarp wo SOURCE_EXTRA=200 -wo SAMPLE_GRID=YES -t_srs '+proj=ortho +lon_0=0 +lat_0=90 +x_0=0.0 +y_0=0 +units=m +no_defs ' short.tif shortOrtho.tif -overwrite
gdal_translate shortOrtho.tif world.png -of PNG -outsize 20% 20%
```

```html
.coast {
    fill: none;
    stroke: grey;
    stroke-width: 0.3;

.graticuleLines {
    fill: none;
    stroke: grey;
    stroke-width: 0.5;
}

.lonLatLabels {
    font-size: 14px;
    alignment-baseline: middle;
    text-anchor: middle;
    fill: red;
}
```

```javascript

<script type="text/javascript">
    var svg = d3.select("body").append("svg")
    .attr("width", '600')
    .attr("height", '600')
    .attr("id", "main");

    svg.append('g').attr('id', 'grat')
    svg.append('g').attr('id', 'img')
    svg.append('g').attr('id', 'coast')
    svg.append('g').attr('id', 'points')
    svg.append('g').attr('id', 'colBarPoint')

    var baseProj = baseMap(container = 'main',
                           projection = 'Orthographic',
                           rotate = [0, -90, 0],
                           clAngle = 90, 
                           extentBounds = [[-180, 0], [179.9999, 90]]);
    
    plotGraticule(container = 'grat',
                  base = baseProj,
                  step = [20, 20],
                  plotGratLines = true,
                  plotOutline = false,
                  sphereR = 90,
                  plotGratText = false,
                  cssStyle = 'graticuleLines',
                  latTxtLon = 0,
                  lonTxtLat = 0,
                  lonOff = 0,
                  latOff = 0);

    plotBase(container ='coast',
            base = baseProj, topoFile = 'world_10m.topojson',
            geomName = 'world_10m',
            plotCoast = true,
            plotLand = false,
            plotCountries = false,
            cssStyle = 'coast');

    plotImage(container = 'img',
              base = baseProj,
              imageFile = 'world.png',
              imgBounds = [],
              imgCenter = [],
              sphere = true)

    var colSclPoint = plotPoints(container = 'points',
                                 base = baseProj, pointFile = 'samples.csv',
                                 pointR = 5, 
                                 colorVar = 'Altitude',
                                 colorScale = 'Linear',
                                 colorRange = ['red', 'blue'],
                                 cssStyle = 'geoPoints')

    setTimeout(function() { plotColBar(container = 'colBarPoint',
                                       x = 110, y = 30,
                                       width = 30, height = 120, 
                                       colScale = colSclPoint, 
                                       nOfSections = 100, 
                                       text = true, 
                                       barTextDigits = 0, 
                                       barTitle = 'Altitude (m a.s.l)', 
                                       horizontal = false); }, 50);
```

![alt text](examples/exampl2.png?raw=true)


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
    fill: blue;
}

.legendTxt{
    font-size: 14px;
}
```

```javascript
svg.append('g').attr('id', 'grat')
svg.append('g').attr('id', 'gratTxt')
svg.append('g').attr('id', 'vector')
svg.append('g').attr('id', 'coast')
svg.append('g').attr('id', 'scale')
svg.append('g').attr('id', 'colBar')

var baseProj = baseMap(container = 'main',
                        projection = 'ConicConformal',
                        rotate = [-20, 0, 0],
                        clAngle = 0, 
                        extentBounds = [[0, 50], [40, 70]]);
    
plotGraticule(container = 'grat',
            base = baseProj,
            step = [5, 5],
            plotGratLines = true,
            plotOutline = true,
            sphereR = 0,
            plotGratText = false,
            cssStyle = 'graticuleLines',
            latTxtLon = 0,
            lonTxtLat = 0,
            lonOff = 0,
            latOff = 0);

plotGraticule(container = 'gratTxt',
            base = baseProj,
            step = [5, 5],
            plotGratLines = false,
            plotOutline = false,
            sphereR = 0,
            plotGratText = true,
            cssStyle = 'lonLatLabels',
            latTxtLon = 0,
            lonTxtLat = 50,
            lonOff = 10,
            latOff = -10);

plotScale('scale', baseProj, 15, 53, 200)

plotBase(container ='coast',
        base = baseProj, topoFile = 'world_10m.topojson',
        geomName = 'world_10m',
        plotCoast = true,
        plotLand = false,
        plotCountries = false,
        cssStyle = 'coast');

var colSclVector = plotVector(container = 'vector', 
                                  base = baseProj, 
                                  vectorFile = 'lakes_50m.json', 
                                  vctFormat = 'geoJson',
                                  geomName = '', 
                                  vctProperty = 'scalerank', 
                                  excludeValues = [],
                                  vctDataScale = 1, 
                                  colorScale = 'Linear', 
                                  colorRange = ['#37FDFC', '#0276FD'], 
                                  cssStyle = 'vectorFeatures', 
                                  renderCanvas = false,
                                  canvasWidth = null,
                                  canvasHeight = null);

setTimeout(function() { plotColBar(container = 'colBar',
                                   x = 350, y = 470,
                                   width = 130, height = 20, 
                                   colScale = colSclVector, 
                                   nOfSections = 150, 
                                   text = true, 
                                   barTextDigits = 0, 
                                   barTitle = 'Lake Rank', 
                                   horizontal = true,
                                   cssStyle = 'legendTxt'); }, 50);
```

![alt text](examples/exampl3.png?raw=true)

### Plot rasters
Raster datasets can be quite heavy for visualization programs to process. Anaximander utilizes the canvas element to make
this task easier for the browsers. In the following example we plot the annual mean temperature (http://chelsa-climate.org/) in Greece. The raster was obtained at
at 30 arc second (~1 km<sup>2</sup>) resolution. We first need to transform the raster to json format that can used from Javascript. For that, 
I use a function from the chorospy package (https://github.com/spyrostheodoridis/chorospy). The map is in Transverse Mercator projection rotate by 21 degrees (the central meridian of UTM zone 34).

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

.scaleBar {
    stroke: black;
    stroke-width: 2px;
    fill: none;
}
.coast {
    fill: none;
    stroke: black;
    stroke-width: 0.3;
}

.legendTxt{
    font-size: 14px;
}
```

```javascript

svg.append('g').attr('id', 'grat')
svg.append('g').attr('id', 'gratTxt')
vg.append('g').attr('id', 'canvas')
svg.append('g').attr('id', 'coast')
svg.append('g').attr('id', 'scale')
svg.append('g').attr('id', 'colBar')


var baseProj = baseMap(container = 'main',
                        projection = 'TransverseMercator',
                        rotate = [-21, 0, 0],
                        clAngle = 0, 
                        extentBounds = [[19, 34], [28, 45]]);
    
plotGraticule(container = 'grat',
            base = baseProj,
            step = [5, 5],
            plotGratLines = true,
            plotOutline = true,
            sphereR = 0,
            plotGratText = false,
            cssStyle = 'graticuleLines',
            latTxtLon = 0,
            lonTxtLat = 0,
            lonOff = 0,
            latOff = 0);

plotGraticule(container = 'gratTxt',
            base = baseProj,
            step = [5, 5],
            plotGratLines = false,
            plotOutline = false,
            sphereR = 0,
            plotGratText = true,
            cssStyle = 'lonLatLabels',
            latTxtLon = 19,
            lonTxtLat = 45,
            lonOff = -10,
            latOff = -10);


plotScale('scale', baseProj, 20, 35, 100)

plotBase(container ='coast',
        base = baseProj, topoFile = 'world_10m.topojson',
        geomName = 'world_10m',
        plotCoast = true,
        plotLand = false,
        plotCountries = false,
        cssStyle = 'coast');

var colSclImg = plotRaster(container = 'canvas', 
                               base = baseProj, 
                               rasterFile = 'climD3.json', 
                               dataScale = 10, 
                               excludeValues = [], 
                               colorScale = 'Linear', 
                               colorRange = ['blue', 'red'], 
                               rScale = 10, 
                               sphere = false);
    

setTimeout(function() { plotColBar(container = 'colBar',
                                   x = 350, y = 70,
                                   width = 130, height = 20, 
                                   colScale = colSclImg, 
                                   nOfSections = 150, 
                                   text = true, 
                                   barTextDigits = 1, 
                                   barTitle = 'Annual Mean Temperature (C°)', 
                                   horizontal = true,
                                   cssStyle = 'legendTxt'); }, 5000);
```

![alt text](examples/exampl4.png?raw=true)
