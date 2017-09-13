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

## Case 1: Plot points
The following html script creates a map with points colored according to associated values. In this case the points correspond to plant population localities
and their colors to the associated altitude. The map spans Eurasia (extentBounds). The points are in csv format, and the columns names are 'x' for longitude and 'y' for latitude. 

```javascript
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

<body>
	
</body>

<script type="text/javascript">

const mapPars = {
	//base parameters
	projection: d3.geoMollweide(),
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
	colMapImg: d3.scaleLinear().interpolate(d3.interpolateRgb).range(['blue', 'red']),
	colMapVct: d3.scaleLinear().interpolate(d3.interpolateRgb).range(['blue', 'red']),
	colPoint: d3.scaleLinear().interpolate(d3.interpolateRgb).range(['#009900', '#dfbf9f']),

	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>layer data parameters>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	// png image
	plotBaseImage: false, // image should be projected in the same coordinate system as below
	baseImageLayer: 'backExtent.png',
	baseImgBounds: [[-11.54573382380191, 33.5], [121.00000000000001, 72.0]],
	// canvas data parameters
	plotCanvas: false,
	canvasSrc: 'outIMG.json',
	rBarX: 300, // position in pixels
	rBarY: 300, // position in pixels
	// vector json layer parameters
	plotVectorLayer: false,
	vctFormat: 'gJson',
	vectLayerScr: 'outCells.json',
	vBarX: 300, // position in pixels
	vBarY: 400, // position in pixels
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

</script>
```