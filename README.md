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
svg.append('g').attr('id', 'boarders')

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

![alt text](https://raw.githubusercontent.com/spyrostheodoridis/anaximander/master/examples/exampl1.png)

















The following script creates a map with points colored according to associated values. In this case the points correspond to plant population localities
and their colors to the associated altitude. We also plot a georeferenced png image that spans Eurasia. The map is in the orthographic projection with some rotation applied. The points are in csv format, 
and the columns names are 'x' for longitude and 'y' for latitude and 'Altitude' for altitude. The position of the colorbar can be adjusted.


The numerous arguments that are required in the plotMaps function of the module are parsed as a Javascript object. Below, I provide
three different map cases with the associated data preparation scripts. In any case, the function is fed with a global base map in topojson format (https://github.com/topojson/topojson).
This map can be obtained as a shp file from http://www.naturalearthdata.com/downloads/10m-cultural-vectors. Download the Admin 0 – Countries file and run the following commands



Notes:
1. For topo / geojson files use the standard EPSG:4326 projection to make sure that all coordinates are in WGS84 datum. D3 will take care of the reprojection
2. The world topojson file can be directly downloaded from this repository
3. Sepending on the projection, you may need to open world_10m.json with a text editor, go at the end of the file, and change "translate":[-179.999999,-90] to "translate":[-180,-90] (for Orthographic) or to [-180, 89.99999] (for Equirectangular or Mollweide)

The configurable html code below applies to all cases.
```html
<!DOCTYPE html>

<head>
	<script src="https://d3js.org/d3.v4.min.js"></script>
	<script src="https://d3js.org/d3-geo-projection.v1.min.js"></script>
	<script src="https://d3js.org/topojson.v2.min.js"></script>
	<script src="http://api.tiles.mapbox.com/mapbox.js/plugins/turf/v2.0.0/turf.min.js"></script>
	<script src="bioDivMaps.js"></script>
	<title>bioDivMaps</title>
</head>

<style>

svg {
  font-family: helvetica;
  font-size: 18px;
}

.graticule {
	fill: none;
	stroke: grey;
	stroke-width: 0.5;
}

.mapBoarders {
	fill: none;
	stroke: white;
	stroke-width: 0.5;
}

.baseMap {
	fill: LightGray;
}

.points {
	fill: grey;
	stroke: black;
	fill-opacity: 1;
}

.scaleBar {
  stroke-width: 3;
  stroke: black;

</style>

<body></body>
```


## Plot points
The following html script creates a map with points colored according to associated values. In this case the points correspond to plant population localities
and their colors to the associated altitude. We also plot a georeferenced png image that spans Eurasia. The map is in the orthographic projection with some rotation applied. The points are in csv format, 
and the columns names are 'x' for longitude and 'y' for latitude and 'Altitude' for altitude. The position of the colorbar can be adjusted.

### Prepare image
```bash
# first clip the raster (it's in wgs84) to the desired extent. The one we use is the Blue Marble raster without the sea
gdalwarp -te -10 30 120 70 worldMarbleNoWater.tif short.tif -overwrite
# then convert it to orthographic projection. lon_0 and lat_0 correspond to the rotation we apply
gdalwarp -t_srs '+proj=ortho +ellps=WGS84 +datum=WGS84 +lon_0=40 +lat_0=60 +units=m +no_defs' short.tif shortOrtho.tif -overwrite
# finally convert it to png
gdal_translate shortOrtho.tif shortOrtho.png -of PNG -outsize 20% 20%
```
We also need to get the png extent in lon/lat datum. This can be done using gdalinfo. The png extent is the following:  
Lower Left : [-3.0027847026909136, 13.418902735883536]  
Upper Right : [143.59043502752442, 28.66678729004727]  

Now in javascript

```javascript

<script type="text/javascript">

const mapPars = {
	//base parameters
	projection: {projection: 'geoOrthographic', rotate: [-40, -60, 0]}, //d3.geoMercator(), d3.geoEquirectangular()
	extentBounds: [[-180,-90], [179.999, 90]],
	MainWidth: 1100,
	MainHeight: 600,
	BaseMap: 'world_10m.topojson',
	plotGraticule: true,
	plotOutline: true,
	plotCountryBoarders: true,
	plotCoast: false,
	plotBase: true,
	plotGratText: false,
	barTextDigits: 1,

	//color maps
	//colMapImg: d3.scaleLinear().interpolate(d3.interpolateHslLong).range(['red', 'blue']),
	//colMapVct: d3.scaleLinear().interpolate(d3.interpolateRgb).range(['blue', 'red']),
	colPoint: d3.scaleLinear().interpolate(d3.interpolateHsl).range(['red', 'blue']),

	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>layer data parameters>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	// png image
	plotBaseImage: true, // image should be projected in the same coordinate system as above
	baseImageLayer: 'shortOrtho.png',
	baseImgBounds: [[-3.0027847026909136, 13.418902735883536], [143.59043502752442, 28.66678729004727]], //lower left, upper right
	globe: false, // true in case the image is the full globe in orthographic projection
	//globeCenter: [40.00114624013347, 59.990891679885756], // lon_0 and lat_0 (center) of the globe image
	// canvas data parameters
	plotCanvas: false,
	//canvasSrc: '', //the json source file
	//rBarX: 800, // position in pixels
	//rBarY: 550, // position in pixels
	//rScale: 150, // the higher the better (unless you get an error then trim it)
	//imgDataScale: 10,
	// vector json layer parameters
	plotVectorLayer: false,
	//vctFormat: 'gJson',
	//vectLayerScr: '', // the geo/topo json source file
	//vBarX: 500, // position in pixels
	//vBarY: 400, // position in pixels
	//vctDataScale: 10, // rescale data
	// point parameters
	plotPoints: true,
	pointFile: 'samples.csv', // csv point file
	pointR: 5,
	colorPoints: true,
	colorVar: 'Altitude',
	pBarX: 500, // position in pixels
	pBarY: 500, // position in pixels
	// scale bar parameters
	plotScale: false,
	get Lat0 () {
    return this.extentBounds[0][1] + (this.extentBounds[1][1] - this.extentBounds[0][1])/2;
 	},
 	get Lon0 () {
    return this.extentBounds[0][0] + (this.extentBounds[1][0] - this.extentBounds[0][0])/2;
 	},
	scaleBarOff: [0 , 0.04], // offset of the scale bar
	dx: 300, // in km
	earthR: 6371 // earth radius in km
}

plotMap(mapPars)

</script>
```

![alt text](https://raw.githubusercontent.com/spyrostheodoridis/biodivMaps/master/examples/exmpl1.png)

## Plot raster
The following html script creates a map that shows the annual mean temperature (http://chelsa-climate.org/) in southern Europe. The raster was obtained at
at 30 arc second (~1 km<sup>2</sup>) resolution. We first need to transform the raster to json format that can used from Javascript. For that, 
I use a function from the chorospy package (https://github.com/spyrostheodoridis/chorospy). The map is in Web Mercator projection.

```bash
# first clip the raster to the desired extent
gdalwarp -te -10 35 30 45 CHELSA_bio10_1.tif  bio1.tif -overwrite 
# then transform it to json
chorospy.rasterToJSON('bio1.tif', 'bio1.json', 3857)
```
Now in the javascript parameter object
```javascript
<script type="text/javascript">

const mapPars = {
	//base parameters
	projection: {projection: 'geoMercator', rotate: [0, 0, 0]},
	extentBounds: [[-10,35], [30, 45]],
	MainWidth: 1100,
	MainHeight: 600,
	BaseMap: 'world_10m.topojson',
	plotGraticule: true,
	plotOutline: true,
	plotCountryBoarders: false,
	plotCoast: false,
	plotBase: false,
	plotGratText: false,
	barTextDigits: 1,

	//color maps
	colMapImg: d3.scaleLinear().interpolate(d3.interpolateHslLong).range(['blue', 'red']),

	plotCanvas: true,
	canvasSrc: 'bio1.json', //the json source file
	rBarX: 800, // position in pixels
	rBarY: 500, // position in pixels
	rScale: 5, // the higher the better (unless you get an error then trim it)
	imgDataScale: 10,
}

plotMap(mapPars)
</script>
```
![alt text](https://raw.githubusercontent.com/spyrostheodoridis/biodivMaps/master/examples/exmpl2.png)

## Plot vector
The same climatic data set above can be plotted as a vector file as well. The following script creates a map at a narrower extent (a part of Northern Greece), but climate is now in vector format.
The map is in Transverse Mercator projection rotate by 21 degrees (the central meridian of UTM zone 34).

```bash
# First transform the raster to shp and then to geojson
gdalwarp -te 22.7 39.8 24.5 41 CHELSA_bio10_1.tif bio1.tif -overwrite
gdal_polygonize.py bio1.tif -f "ESRI Shapefile" bio1.shp
ogr2ogr -f GeoJSON -t_srs EPSG:4326 bio1.geojson bio1.shp
```

```javascript
const mapPars = {
	//base parameters
	projection: {projection: 'geoTransverseMercator', rotate: [-21, 0, 0]},
	extentBounds: [[22.7, 39.8], [24.5, 41]],
	MainWidth: 1100,
	MainHeight: 600,
	BaseMap: 'world_10m.topojson',
	plotGraticule: false,
	plotOutline: true,
	plotCountryBoarders: false,
	plotCoast: true,
	plotBase: false,
	plotGratText: false,
	barTextDigits: 1,

	//color maps
	colMapVct: d3.scaleLinear().interpolate(d3.interpolateHslLong).range(['blue', 'red']),

	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>layer data parameters>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	
	// vector json layer parameters
	plotVectorLayer: true,
	vctFormat: 'gJson',
	vectLayerScr: 'bio1.geojson', // the geo/topo json source file
	vBarX: 660, // position in pixels
	vBarY: 510, // position in pixels
	vctDataScale: 10, // rescale data
	
	// scale bar parameters
	plotScale: true,
	get Lat0 () {
    return this.extentBounds[0][1] + (this.extentBounds[1][1] - this.extentBounds[0][1])/2;
 	},
 	get Lon0 () {
    return this.extentBounds[0][0] + (this.extentBounds[1][0] - this.extentBounds[0][0])/2;
 	},
	scaleBarOff: [-0.5 , 0.5], // offset of the scale bar
	dx: 30, // in km
	earthR: 6371 // earth radius in km
}

plotMap(mapPars)

</script>
```
![alt text](https://raw.githubusercontent.com/spyrostheodoridis/biodivMaps/master/examples/exmpl3.png)

