# bioDivMaps

The bioDivMaps module can be used for creating biodiversity oriented maps for the web (or for scientific publications). The module is written in Javascript. It takes advantage of the 
powerful d3.js (https://d3js.org/) visualization library and the HTML canvas element (https://www.w3schools.com/html/html5_canvas.asp) for efficient handling of big raster data sets.

The numerous arguments that are required in the plotMaps function of the module are parsed as a Javascript object. Below I provide
three different map cases with the associated data preparation scripts. In any case, the function is fed with a global base map in topojson format (https://github.com/topojson/topojson).
This map can be obtained as a shp file from http://www.naturalearthdata.com/downloads/10m-cultural-vectors. Download the Admin 0 – Countries file and run the following commands

```bash
ogr2ogr -f GeoJSON -t_srs EPSG:4326 world_10m.json ne_10m_admin_0_countries/ne_10m_admin_0_countries.shp -select admin,continent
geo2topo world_10m.json > world_10m.topojson -q 1000000
```

Notes:
Use the standard EPSG:4326 projection to make sure that the files are in WGS84 datum