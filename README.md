# bioDivMaps

The bioDivMaps module can be used for creating biodiversity oriented maps for the web (or for scientific publications). The module is written in Javascript. It takes advantage of the 
powerful d3.js (https://d3js.org/) visualization library and the HTML canvas element (https://www.w3schools.com/html/html5_canvas.asp) for efficient handling of big raster data sets.

The numerous arguments that are required in the plotMaps function of the module are parsed as a Javascript object. Below, I provide
three different map cases with the associated data preparation scripts. In any case, the function is fed with a global base map in topojson format (https://github.com/topojson/topojson).
This map can be obtained as a shp file from http://www.naturalearthdata.com/downloads/10m-cultural-vectors. Download the Admin 0 – Countries file and run the following commands

```bash
ogr2ogr -f GeoJSON -t_srs EPSG:4326 world_10m.json ne_10m_admin_0_countries/ne_10m_admin_0_countries.shp -select admin,continent
geo2topo world_10m.json > world_10m.topojson -q 1000000
```

Notes:
1. For topo / geojson files use the standard EPSG:4326 projection to make sure that all coordinates are in WGS84 datum. D3 will take care of the reprojection
2. The world topojson file can be directly downloaded from this repository
3. You may need to open world_10m.json with a text editor and change "translate":[--179.999999,-90] to "translate":[-180,-90]

The configurable html code below applies to all cases.
```html
<!DOCTYPE html>

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
    stroke-width: 1;
}

.mapBoarders {
    fill: none;
    stroke: white;
    stroke-width: 0.5;
}

.baseMap {
    fill: grey;
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
and their colors to the associated altitude. The map is in the web mercator projection with some rotation applied. The points are in csv format, 
and the columns names are 'x' for longitude and 'y' for latitude and 'Altitude' for altitude. The position of the colorbar can be adjusted.

```javascript

<script type="text/javascript">

const mapPars = {
	//base parameters
	projection: {projection: 'geoOrthographic', rotate: [-40, -60, 0]},
	extentBounds: [[-180,-90], [179.999, 90]],
	MainWidth: 1100,
	MainHeight: 600,
	BaseMap: 'world_10m.topojson',
	plotGraticule: false,
	plotOutline: true,
	plotCountryBoarders: false,
	plotCoast: false,
	plotBase: true,
	plotGratText: false,

	//color maps
	//colMapImg: d3.scaleLinear().interpolate(d3.interpolateHslLong).range(['red', 'blue']),
	//colMapVct: d3.scaleLinear().interpolate(d3.interpolateRgb).range(['blue', 'red']),
	colPoint: d3.scaleLinear().interpolate(d3.interpolateHsl).range(['#009900', '#dfbf9f']),

	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>layer data parameters>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	// png image
	plotBaseImage: false, // image should be projected in the same coordinate system as above
	//baseImageLayer: 'world_marbleMerc.png',
	//baseImgBounds: [[17.09986032275, 58.70819384965], [179.9953477348346, 83.63410065304986]],
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

	//color maps
	colMapImg: d3.scaleLinear().interpolate(d3.interpolateHslLong).range(['blue', 'red']),
	//colMapVct: d3.scaleLinear().interpolate(d3.interpolateRgb).range(['blue', 'red']),
	//colPoint: d3.scaleLinear().interpolate(d3.interpolateHsl).range(['#009900', '#dfbf9f']),

	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>layer data parameters>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	// png image
	plotBaseImage: false, // image should be projected in the same coordinate system as above
	//baseImageLayer: 'world_marbleMerc.png',
	//baseImgBounds: [[17.09986032275, 58.70819384965], [179.9953477348346, 83.63410065304986]],
	// canvas data parameters
	plotCanvas: true,
	canvasSrc: 'bio1.json', //the json source file
	rBarX: 800, // position in pixels
	rBarY: 500, // position in pixels
	rScale: 5, // the higher the better (unless you get an error then trim it)
	imgDataScale: 10,
	// vector json layer parameters
	plotVectorLayer: false,
	//vctFormat: 'gJson',
	//vectLayerScr: '', // the geo/topo json source file
	//vBarX: 500, // position in pixels
	//vBarY: 400, // position in pixels
	//vctDataScale: 10, // rescale data
	// point parameters
	plotPoints: false,
	//pointFile: 'samples.csv', // csv point file
	//pointR: 5,
	//colorPoints: true,
	//colorVar: 'Altitude',
	//pBarX: 500, // position in pixels
	//pBarY: 500, // position in pixels
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

	//color maps
	//colMapImg: d3.scaleLinear().interpolate(d3.interpolateHslLong).range(['blue', 'red']),
	colMapVct: d3.scaleLinear().interpolate(d3.interpolateHslLong).range(['blue', 'red']),
	//colPoint: d3.scaleLinear().interpolate(d3.interpolateHsl).range(['#009900', '#dfbf9f']),

	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>layer data parameters>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	// png image
	plotBaseImage: false, // image should be projected in the same coordinate system as above
	//baseImageLayer: 'world_marbleMerc.png',
	//baseImgBounds: [[17.09986032275, 58.70819384965], [179.9953477348346, 83.63410065304986]],
	// canvas data parameters
	plotCanvas: false,
	//canvasSrc: '', //the json source file
	//rBarX: 800, // position in pixels
	//rBarY: 500, // position in pixels
	//rScale: 5, // the higher the better (unless you get an error then trim it)
	//imgDataScale: 10, // rescale data
	// vector json layer parameters
	plotVectorLayer: true,
	vctFormat: 'gJson',
	vectLayerScr: 'bio1.geojson', // the geo/topo json source file
	vBarX: 660, // position in pixels
	vBarY: 510, // position in pixels
	vctDataScale: 10, // rescale data
	// point parameters
	plotPoints: false,
	//pointFile: 'samples.csv', // csv point file
	//pointR: 5,
	//colorPoints: true,
	//colorVar: 'Altitude',
	//pBarX: 500, // position in pixels
	//pBarY: 500, // position in pixels
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

