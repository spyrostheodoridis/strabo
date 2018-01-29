# anaximander

Anaximander: one of the first Greek philosophers to work on the fields of what we now call geography and biology.

The anaximander library can be used for creating biodiversity oriented maps for the web (or for scientific publications). The module is written in Javascript. It takes advantage of the 
powerful d3.js (https://d3js.org/) visualization library and the HTML canvas element (https://www.w3schools.com/html/html5_canvas.asp) for efficient handling of big raster data sets.
It aims at providing researchers with a tool to accurately and effectively visualize spatial information

The library is divided in several modules that all depend on a basic module (the baseMap function). In the baseMap module, the user
defines the map projections and extent. All other modules rely on this information to plot features and images. The style of the elements
can be partly defined using CSS rules. Style definitions will be extended in future versions.

Before we start, download the required libraries and include the following headers in your .html file 

```html
<!DOCTYPE html>

<head>
    <meta charset="utf-8"/>
    <script src="d3.v4.min.js"></script> 
    <script src="d3-geo-projection.v2.min.js"></script>
    <script src="topojson.v2.min.js"></script>
    <script src="turf.min.js"></script>
    <script src="anaximander.js"></script>
    <title>Anaximander</title>
</head>
```

## Examples
### Plot georeferenced image
We will first look at how the user can plot a georeferenced image on a map. We first need to prepare the vector file that contains the world. This file
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
gdalwarp -t_srs '+proj=ortho +lon_0=60 +lat_0=50 +x_0=0.0 +y_0=0 +units=m +no_defs ' short.tif shortOrtho.tif -overwrite
# finally convert it to png
gdal_translate shortOrtho.tif shortOrtho.png -of PNG -outsize 20% 20%
```

We also need to get the png center and at least one edge point in lon/lat datum. This can be done using gdalinfo. We use the following points:  
Center : [53.180775287372114, 54.90430000342316]
Lower Left : [-0.15232519571244724, 12.344536593112801]  
Upper Right : [155.14505364913532, 32.53258732338759]


Now in javascript

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
<style>
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


We can also plot images that cover the whole sphere face setting the sphere argument to true. In this case no imgBounds are necessary (actually they are not defined!)
We also add some text for the parallels and meridians.

```bash
gdalwarp -te -180 0 180 90 worldMarbleNoWater.tif short.tif -overwrite
gdalwarp -t_srs '+proj=ortho +lon_0=0 +lat_0=90 +x_0=0.0 +y_0=0 +units=m +no_defs ' short.tif shortOrtho.tif -overwrite
gdal_translate shortOrtho.tif shortOrtho.png -of PNG -outsize 20% 20%
```

```html
<style>
.land {
    fill: grey;
    fill-opacity: 0.3;

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
	svg.append('g').attr('id', 'land')
	svg.append('g').attr('id', 'img')
	svg.append('g').attr('id', 'gratTxt')

	var baseProj = baseMap(container = 'main',
                        projection = 'Orthographic',
                        rotate = [0, -90, 0],
                        clAngle = 90, 
                        extentBounds = [[-180, 0], [179.9999, 90]]);
    
    plotGraticule(container = 'grat',
                base = baseProj,
                step = [20, 20],
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
                step = [20, 20],
                plotGratLines = false,
                plotOutline = false,
                sphereR = 0,
                plotGratText = true,
                cssStyle = 'lonLatLabels',
                latTxtLon = -170,
                lonTxtLat = 0,
                lonOff = 0,
                latOff = 0);

    plotImage(container = 'img',
            base = baseProj,
            imageFile = 'world.png',
            imgBounds = [],
            imgCenter = [],
            sphere = true)
```

![alt text](examples/exampl2.png?raw=true)

