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
1. Use the standard EPSG:4326 projection to make sure that the files are in WGS84 datum
2. The topojson file can be directly downloaded from this repository

The configurable html code below applies to all cases.
```html
<!DOCTYPE html>

<head>
	<script src="https://d3js.org/d3.v4.min.js"></script>
	<script src="https://d3js.org/d3-geo-projection.v1.min.js"></script>
	<script src="https://d3js.org/topojson.v2.min.js"></script>
	<script src="http://api.tiles.mapbox.com/mapbox.js/plugins/turf/v2.0.0/turf.min.js"></script>
	<script src="bioDivMaps.js"></script>
	<title>General Maps</title>
</head>

<style>

svg {
  font-family: helvetica;
  font-size: 12px;
}

.graticule {
	fill: none;
	stroke: black;
	stroke-width: 1;
}

.mapBoarders {
	fill: none;
	stroke: black;
	stroke-width: 1;
}

.baseMap {
	fill: Gainsboro;
}

.points {
	fill: purple;
	stroke: none;
}

.scaleBar {
  stroke-width: 3;
  stroke: black;

</style>

<body></body>
```


## Plot points
The following html script creates a map with points colored according to associated values. In this case the points correspond to plant population localities
and their colors to the associated altitude. The map spans Eurasia (extentBounds) and it's in the web mercator projection. The points are in csv format, 
and the columns names are 'x' for longitude and 'y' for latitude. 

```javascript

const mapPars = {
	//base parameters
	projection: d3.geoMercator(), //web mercator 
	extentBounds: [[-10, 30], [180, 80]], // map extent
	MainWidth: 1100,
	MainHeight: 600,
	BaseMap: 'world_10m.topojson',
	plotGraticule: true,
	plotOutline: true,
	plotCountryBoarders: false,
	plotCoast: true,
	plotBase: true,
	plotGratText: true,

	//color maps
	//colMapImg: d3.scaleLinear().interpolate(d3.interpolateRgb).range(['blue', 'red']),
	//colMapVct: d3.scaleLinear().interpolate(d3.interpolateRgb).range(['blue', 'red']),
	colPoint: d3.scaleLinear().interpolate(d3.interpolateRgb).range(['#009900', '#dfbf9f']),

	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>layer data parameters>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	// png image
	plotBaseImage: false, // image should be projected in the same coordinate system as below
	//baseImageLayer: 'backExtent.png',
	//baseImgBounds: [[-11.54573382380191, 33.5], [121.00000000000001, 72.0]],
	// canvas data parameters
	plotCanvas: false,
	//canvasSrc: 'outIMG.json',
	//rBarX: 300, // position in pixels
	//rBarY: 300, // position in pixels
	// vector json layer parameters
	plotVectorLayer: false,
	//vctFormat: 'gJson',
	//vectLayerScr: 'outCells.json',
	//vBarX: 300, // position in pixels
	//vBarY: 400, // position in pixels
	// point parameters
	plotPoints: true,
	pointFile: 'samples.csv',
	colorPoints: true,
	colorVar: 'Altitude', // The variable for the color scheme
	pBarX: 300, // position in pixels
	pBarY: 500, // position in pixels
	// scale bar parameters
	plotScale: true,
	get Lat0 () {
    return this.extentBounds[0][1] + (this.extentBounds[1][1] - this.extentBounds[0][1])/2;
 	},
	Lon0: 10,
	scaleBarOff: [50 , -10], // offset of the scale bar
	dx: 800, // in km
	earthR: 6371 // earth radius in km
}

plotMap(mapPars)
```

## Plot raster
The following html script creates a map that shows the annual mean temperature (http://www.worldclim.org/) in Europe. The raster was obtained at
at 10 minutes (~340 km<sup>2</sup>) resolution. We first need to transform the raster to json format that can used from Javascript. For that, 
I use a function from the chorospy package (https://github.com/spyrostheodoridis/chorospy). The map is in Mollweide projection.

```bash
# first clip the raster to the desired extent
gdalwarp -te -10 35 40 75 ../../Downloads/wc2.0_10m_bio/wc2.0_bio_10m_01.tif bio1.tif -overwrite 
# then transform it to json
chorospy.rasterToJSON('bio1.tif', 'bio1.json', 54009)
```

```javascript
const mapPars = {
	//base parameters
	projection: d3.geoMollweide(),
	extentBounds: [[-10, 35], [40, 75]], // [[-180, -80], [180, 84]] map extent
	MainWidth: 1100,
	MainHeight: 600,
	BaseMap: 'world_10m.topojson',
	plotGraticule: true,
	plotOutline: true,
	plotCountryBoarders: false,
	plotCoast: true,
	plotBase: true,
	plotGratText: true,

	//color maps
	colMapImg: d3.scaleLinear().interpolate(d3.interpolateRgb).range(['blue', 'red']),
	//colMapVct: d3.scaleLinear().interpolate(d3.interpolateRgb).range(['blue', 'red']),
	//colPoint: d3.scaleLinear().interpolate(d3.interpolateRgb).range(['#009900', '#dfbf9f']),

	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>layer data parameters>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	// png image
	plotBaseImage: false, // image should be projected in the same coordinate system as below
	//baseImageLayer: 'backExtent.png',
	//baseImgBounds: [[-11.54573382380191, 33.5], [121.00000000000001, 72.0]],
	// canvas data parameters
	plotCanvas: true,
	canvasSrc: 'bio1.json',
	rBarX: 500, // position in pixels
	rBarY: 300, // position in pixels
	// vector json layer parameters
	plotVectorLayer: false,
	//vctFormat: 'gJson',
	//vectLayerScr: 'outCells.json',
	//vBarX: 300, // position in pixels
	//vBarY: 400, // position in pixels
	// point parameters
	plotPoints: false,
	//pointFile: 'samples.csv',
	//colorPoints: true,
	//colorVar: 'Altitude',
	//pBarX: 300, // position in pixels
	//pBarY: 500, // position in pixels
	// scale bar parameters
	plotScale: true,
	get Lat0 () {
    return this.extentBounds[0][1] + (this.extentBounds[1][1] - this.extentBounds[0][1])/2;
 	},
	Lon0: 10,
	scaleBarOff: [10 , -10], // offset of the scale bar
	dx: 800, // in km
	earthR: 6371 // earth radius in km
}

plotMap(mapPars)
```

## Plot vector
The same climatic data set above can be plotted as a vector file as well. The following script creates a map at a narrower extent (compared to Case 2), but climate is now in vector format.

```bash
# First transform the raster to shp and then to geojson
gdalwarp -te -10 35 20 50 ../../Downloads/wc2.0_10m_bio/wc2.0_bio_10m_01.tif bio1.tif -overwrite
gdal_polygonize.py bio1.tif -f "ESRI Shapefile" bio1.shp
ogr2ogr -f GeoJSON -t_srs EPSG:4326 bio1.geojson bio1.shp
```

```javascript
const mapPars = {
	//base parameters
	projection: d3.geoMollweide(),
	extentBounds: [[-10, 35], [20, 50]], // [[-180, -80], [180, 84]] map extent
	MainWidth: 1100,
	MainHeight: 600,
	BaseMap: 'world_10m.topojson',
	plotGraticule: true,
	plotOutline: true,
	plotCountryBoarders: false,
	plotCoast: true,
	plotBase: true,
	plotGratText: true,

	//color maps
	//colMapImg: d3.scaleLinear().interpolate(d3.interpolateRgb).range(['blue', 'red']),
	colMapVct: d3.scaleLinear().interpolate(d3.interpolateRgb).range(['blue', 'red']),
	//colPoint: d3.scaleLinear().interpolate(d3.interpolateRgb).range(['#009900', '#dfbf9f']),

	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>layer data parameters>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	// png image
	plotBaseImage: false, // image should be projected in the same coordinate system as below
	//baseImageLayer: 'backExtent.png',
	//baseImgBounds: [[-11.54573382380191, 33.5], [121.00000000000001, 72.0]],
	// canvas data parameters
	plotCanvas: false,
	//canvasSrc: 'bio1.json',
	//rBarX: 500, // position in pixels
	//rBarY: 300, // position in pixels
	// vector json layer parameters
	plotVectorLayer: true,
	vctFormat: 'gJson',
	vectLayerScr: 'bio1.geojson',
	vBarX: 500, // position in pixels
	vBarY: 400, // position in pixels
	// point parameters
	plotPoints: false,
	//pointFile: 'samples.csv',
	//colorPoints: true,
	//colorVar: 'Altitude',
	//pBarX: 300, // position in pixels
	//pBarY: 500, // position in pixels
	// scale bar parameters
	plotScale: true,
	get Lat0 () {
    return this.extentBounds[0][1] + (this.extentBounds[1][1] - this.extentBounds[0][1])/2;
 	},
	Lon0: 10,
	scaleBarOff: [0 , 0], // offset of the scale bar
	dx: 800, // in km
	earthR: 6371 // earth radius in km
}

plotMap(mapPars)
```

