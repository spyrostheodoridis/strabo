
function baseMap (container, projection, rotate, clAngle, extentBounds) {

	const mainPlot = d3.select('#' + container);

	const width = mainPlot.node().getAttribute('width');
	const height = mainPlot.node().getAttribute('height');

	//create template
	mainPlot.append('rect')
			.attr('width', width)
			.attr('height', height)
			.attr('x', 0).attr('y', 0)
			.style('fill','none')
			.style('stroke', 'black');

	//define projection and outline
	const proj = eval('d3.geo' + projection + '()');
	proj.scale(1).translate([0,0]).precision(0.1)
		.rotate([rotate[0], rotate[1], rotate[2]]).clipAngle(clAngle);

	const path = d3.geoPath().projection(proj);

	const graticule = d3.geoGraticule();
	graticule.extent([extentBounds[0], extentBounds[1]]);
	
	// initial bounding box of the defined extent for the defined projection
	const clPath0 = mainPlot.append('clipPath')
			.append('path')
			.attr('id', 'clPath0')
			.datum(graticule.outline)
			.attr('d', path);
	const initBox = clPath0.node().getBBox();

	d3.select('clipPath').remove() // clear clipPath
	// redefine scale and translate
	const s = .9 / Math.max( initBox.width / width, initBox.height / height);
	const t = [ (width - s*(2*initBox.x + initBox.width )) / 2, (height - s*(2*initBox.y + initBox.height )) / 2];
	proj.scale(s).translate(t);
	
	obj = {
		'projection': proj,
		'projectionName': projection,
		'graticule': graticule
	};

	return obj;
}


function plotGraticule(container, base, step, plotGratLines = false, plotOutline = false, sphereR = 0, plotGratText = false, cssStyle = '', latTxtLon, lonTxtLat, lonOff = 0, latOff = 0) {

	var container = d3.select('#' + container);

	const path = d3.geoPath().projection(base.projection);

	base.graticule.step(step)

	if (plotGratLines === true) {
		container.append('path').datum(base.graticule).attr('class', cssStyle).attr('d', path);
	}

	if (plotOutline === true) {

		container.append('path')
			.datum(base.graticule.outline)
			.attr('class', cssStyle)
			.attr('d', path);
	};

    if (sphereR){
        const pc = [base.projection.center()[0] - base.projection.rotate()[0], base.projection.center()[1] - base.projection.rotate()[1]]
        container.append('path')
        .attr('d', path(d3.geoCircle().center(pc).radius(sphereR).precision(0.5)()))
            .attr('class', cssStyle);
    };

	if (plotGratText === true) {

		container.selectAll('text')
			.data(base.graticule.lines())
  		  .enter().append('text')
			.each(function(d){
				const lon = (d.coordinates[0][0] === d.coordinates[1][0]) ? true : false
				const lineX = d.coordinates[0][0];
				const lineY = d.coordinates[0][1];
				d3.select(this)
					.attr('x', lon === true ? base.projection([lineX, lonTxtLat])[0] : base.projection([latTxtLon, lineY])[0] + latOff )
					.attr('y', lon === true ? base.projection([lineX, lonTxtLat])[1] + lonOff: base.projection([latTxtLon, lineY])[1] )
					.text(lon === true ? d.coordinates[0][0] : d.coordinates[0][1] )
					.attr('class', cssStyle)
			});
	};
}


function plotScale(container, base, Lon0, Lat0, dx, earthR = 6371) {

	var container = d3.select('#' + container);

	// harvesine formula ==> solve for dλ
	const NewLon = Lon0 + (dx / earthR) * (180 / Math.PI) / Math.cos(Lat0 * Math.PI / 180 );
	const sclBarCoord1 = base.projection([Lon0, Lat0]);
	const sclBarCoord2 = base.projection([NewLon, Lat0]);

	if (base.projectionName.includes('Orthographic') || base.projectionName.includes('Stereographic')){
		const path = d3.geoPath()
    		.projection(base.projection);

		arcs = {type: 'LineString', coordinates: [ [Lon0, Lat0], [NewLon, Lat0] ]};

		container.append('path')
			.attr('class', 'scaleBar')
    		.attr('d', path(arcs));  // great arc's path

    	const scaleText = container.append('text')
			.text(dx + 'km')
			.attr('y', sclBarCoord2[1])
			.attr('dy', '1.2em');

		const bboxScaleT = scaleText.node().getBBox();
		scaleText.attr('x', sclBarCoord1[0] + (sclBarCoord2[0] - sclBarCoord1[0])/2 - bboxScaleT.width/2);

	} else {

		container.append('line')
			.attr('x1', sclBarCoord1[0])
			.attr('y1', sclBarCoord1[1])
			.attr('x2', sclBarCoord2[0])
			.attr('y2', sclBarCoord2[1])
			.attr('class', 'scaleBar');

		const scaleText = container.append('text')
			.text(dx + 'km')
			.attr('y', sclBarCoord2[1])
			.attr('dy', '1.2em');

		const bboxScaleT = scaleText.node().getBBox();
		scaleText.attr('x', sclBarCoord1[0] + (sclBarCoord2[0] - sclBarCoord1[0])/2 - bboxScaleT.width/2);
	}
}


function plotBase(container, base, topoFile, geomName, plotCoast = false, plotLand = false, plotCountries = false, cssStyle = '') {

	const path = d3.geoPath().projection(base.projection);

	const clipID = container + 'Clip'

	var container = d3.select('#' + container);

	// make new clip path from graticule.outline 
	const clPath = container.append('clipPath')
		.attr('id', clipID)
		.append('path')
		.attr('id', clipID + 'Path')
		.datum(base.graticule.outline)
		.attr('d', path);

	d3.json(topoFile, function (error, topology) {
		if (error) return console.log(error); 

		const topoData = topojson.feature(topology, topology.objects[geomName]);

		if (plotCountries === true){ container.append('path')
			.datum(topojson.mesh(topology, topology.objects[geomName], function (a,b) {return a !== b; }))
			.attr('d', path)
			.attr('clip-path', 'url(#' + clipID + ')')
			.attr('class', cssStyle);
		}

		if (plotCoast === true){ container.append('path')
			.datum(topojson.mesh(topology, topology.objects[geomName], function (a,b) {return a === b; }))
			.attr('d', path)
			.attr('clip-path', 'url(#' + clipID + ')')
			.attr('class', cssStyle);
		}

		if (plotLand === true){ container.append('path')
			.datum(topoData)
			.attr('d', path)
			.attr('clip-path', 'url(#' + clipID + ')')
			.attr('class', cssStyle); 
		}
	});
}


function plotImage(container, base, imageFile, imgBounds, imgCenter, sphere = false) {

	const clipID = container + 'Clip'
	const path = d3.geoPath().projection(base.projection);
	var container = d3.select('#' + container);

	// make new clip path from graticule.outline 
	const clPath = container.append('clipPath')
		.attr('id', clipID)
		.append('path')
		.attr('id', clipID + 'Path')
		.datum(base.graticule.outline)
		.attr('d', path);

	// if image is the globe
	if (sphere == true) {

		const mapCenter = base.projection.rotate().map(d=>-d);
		//get the dimensions (pixel width,height) of the sphere
		const rasterDims = getGlobeDims(mapCenter, base)
		const projCenter = base.projection(mapCenter)

		container.append('svg:image')
			.attr('x', projCenter[0] - rasterDims[0]/2)
			.attr('y', projCenter[1] - rasterDims[1]/2)
			.attr('xlink:href', imageFile)
			.attr('width', rasterDims[0])
			.attr('height', rasterDims[1])
			.attr('clip-path', 'url(#' + clipID + ')');

	} else {

		const projCenter = base.projection(imgCenter);

		//imgBounds can have any number of points in it, one is enough for the calculations
		var projRasterWidth = Math.abs(2*d3.max(imgBounds.map(d=>projCenter[0] - base.projection(d)[0])));
		var projRasterHeight = Math.abs(2*d3.max(imgBounds.map(d=>projCenter[1] - base.projection(d)[1])));

		console.log(projRasterWidth, projRasterHeight)
		container.append('svg:image')
			.attr('x', projCenter[0] - projRasterWidth/2)
			.attr('y', projCenter[1] - projRasterHeight/2)
			.attr('xlink:href', imageFile)
			.attr('width', projRasterWidth)
			.attr('height', projRasterHeight)
			.attr('clip-path', 'url(#' + clipID + ')');
	};
}


function plotPoints(container, base, pointFile, pointR, colorVar, colorScale, colorRange, cssStyle = '') {

	const clipID = container + 'Clip'
	var container = d3.select('#' + container);

	const path = d3.geoPath().projection(base.projection);

	// make new clip path from graticule.outline 
	const clPath = container.append('clipPath')
		.attr('id', clipID)
		.append('path')
		.attr('id', clipID + 'Path')
		.datum(base.graticule.outline)
		.attr('d', path);

	//define path for points
	path.pointRadius(pointR)

	const dataValues = [];
	const colScl = eval('d3.scale' + colorScale + '()'); // outside of data function so it can be exported

	// get vertices of clip path and use them to exclude points that fall outside of path
	const clipP = d3.select('#' + clipID + 'Path').node().getAttribute('d')
    const ppList = clipP.replace('M', '').replace('Z', '').split('L')
    ppList.forEach(function(d, i){
        ppList[i] = d.split(',').map(v=>+v)
    })

	d3.csv(pointFile, function (error, data) {
		if (error) return console.log(error);

		// create geojson for points to be used as path
		geoFeat = {}
		geoFeat.type = 'FeatureCollection'
		geoFeat.crs = { 'type': 'name', 'properties': { 'name': 'urn:ogc:def:crs:OGC:1.3:CRS84' } }
		geoFeat.features = []

		data.forEach(d => geoFeat.features.push({ 'type': 'Feature', 'properties': {[colorVar]: +d[colorVar]}, 'geometry': { 'type': 'Point', 'coordinates': [ +d.x, +d.y ] } }))


		//add features to DOM, keep them invisible
		//only features rendered with geopath will have a 'd' attribute
		var ptDataSet = new Set();
		const dataPts = container.selectAll('.geoP')
	  		.data(geoFeat.features)
          .enter().append('path')
	  		.attr('d', path)
	  		.each(function(d,i){
	  			var el = d3.select(this)
	  			const pointCoord = base.projection(d.geometry.coordinates);
	  			//now select only the desired points (those in the path)
	  			if (el._groups[0][0].hasAttribute('d') && inside(pointCoord, ppList)){
	  				ptDataSet.add((d.properties[colorVar]))
	  				el.attr('class', cssStyle)//append the class to the selected features
	  			}	
	  		})
	  		.style('display', 'none')

	  	// set to array
		const ptData = [];
		ptDataSet.forEach(v => ptData.push(v));
		ptDataSet = null;
		//define color scale
		if (colorScale === 'Linear'){
			colScl.interpolate(d3.interpolateHsl).domain(d3.extent(ptData)).range(colorRange)
		}
		else if (colorScale === 'Ordinal'){
			colScl.domain(ptData.sort(d3.ascending)).range(colorRange)
		}
		
		//render points
		d3.selectAll('.'+ cssStyle).each(function(d, i){
			d3.select(this)
		  		.attr('clip-path', 'url(#' + clipID + ')')
		  		.style('display', null)
		  		.style('fill', d=>colScl(d.properties[colorVar]))
		  		.style('stroke', d=>colScl(d.properties[colorVar]))
		});
	});
	
	colScl.type = colorScale; //add type of scale

	return colScl;
}


function plotVector(container, base, vectorFile, vctFormat, geomName, vctProperty, excludeValues, vctDataScale, colorScale, colorRange, cssStyle = '', renderCanvas = false, canvasWidth, canvasHeight){

	const clipID = container + 'Clip'

	var container = d3.select('#' + container);

	var path = d3.geoPath().projection(base.projection);

	// make new clip path from graticule.outline 
	const clPath = container.append('clipPath')
		.attr('id', clipID)
		.append('path')
		.attr('id', clipID + 'Path')
		.datum(base.graticule.outline)
		.attr('d', path);

	if (renderCanvas === true){

		const ratio = window.devicePixelRatio || 1;

		var fo = container.append('foreignObject')
    		.attr("x", 0)
    		.attr("y", 0)
    		.attr("width", canvasWidth)
    		.attr("height", canvasWidth)

		 contx = fo.append('xhtml:canvas')
			.attr('width', ratio*canvasWidth)
			.attr('height', ratio*canvasHeight)
			.style('width', canvasWidth + 'px')
			.style('height', canvasHeight + 'px')
			.attr('id', 'vCanvas').node().getContext('2d');

		contx.scale(ratio, ratio)
	}

	const colScl = eval('d3.scale' + colorScale + '()'); // outside of data function so it can be exported

	d3.json(vectorFile, function(error, vData) {
		if (error) return console.log(error);

		if (vctFormat === 'topoJson') {
			var topoData = topojson.feature(vData, vData.objects[geomName]).features;

		} else if (vctFormat === 'geoJson') {
			var topoData = vData.features;
			topoData.forEach( function(d) {
				//correct last point of polygones if necessary
				if (d.geometry.coordinates[0][0] !== d.geometry.coordinates[0][d.geometry.coordinates[0].length - 1]){
					d.geometry.coordinates[0].push(d.geometry.coordinates[0][0])
				};
			})
		}

		//add features to DOM, keep them invisible
		//only features rendered with geopath will have a 'd' attribute
		var vctDataSet = new Set();
		const dataVectors = container.selectAll('.geoPaths')
	  		.data(topoData)
		  .enter().append('path')
	  		.attr('d', path)
	  		.each(function(d,i){
	  			var el = d3.select(this)
	  			//now select only the desired features (those in the path and with the included values)
	  			if (el._groups[0][0].hasAttribute('d') && turf.intersect(d, base.graticule.outline()) && excludeValues.indexOf(d.properties[vctProperty]) === -1 && d.properties[vctProperty]){
	  				vctDataSet.add((d.properties[vctProperty] / vctDataScale) || d.properties[vctProperty] )
	  				el.attr('class', cssStyle)//append the class to the selected features
	  			}	
	  		})
	  		.style('display', 'none')

		// set to array
		const vctData = [];
		vctDataSet.forEach(v => vctData.push(v));
		vctDataSet = null;
		//define color scale
		if (colorScale === 'Linear'){
			colScl.interpolate(d3.interpolateHsl).domain(d3.extent(vctData)).range(colorRange)
		}
		else if (colorScale === 'Ordinal'){
			colScl.domain(vctData.sort(d3.ascending)).range(colorRange)
		}

		// define clip path for canvas
		if (renderCanvas === true) {
			path.context(contx);
			contx.beginPath();
			path(base.graticule.outline());
			contx.clip();
			//get style
			var fillOpac = d3.select('.'+cssStyle).style('fill-opacity')
			var strokeOpac = d3.select('.'+cssStyle).style('stroke-opacity')
		};

		// render features
		d3.selectAll('.'+ cssStyle).each(function(d, i){
				
			if (renderCanvas === true) {
				fillCol = d3.rgb(colScl(d.properties[vctProperty] / vctDataScale || d.properties[vctProperty]));
				fillCol.opacity = +fillOpac;
				strokeCol = d3.rgb(colScl(d.properties[vctProperty] / vctDataScale || d.properties[vctProperty]));
				strokeCol.opacity = +strokeOpac;
				contx.fillStyle = fillCol.toString();
				contx.strokeStyle = strokeCol.toString();
				
				contx.beginPath();
				path(d);
    			contx.fill();
    			contx.stroke();

			}else {
				d3.select(this)
			  		.attr('clip-path', 'url(#' + clipID + ')')
			  		.style('display', null)
			  		.style('fill', function(d) {
			  			if (excludeValues.indexOf(d.properties[vctProperty]) === -1) {
			  				return colScl(d.properties[vctProperty] / vctDataScale || d.properties[vctProperty])
			  			} else {return 'none'}
			  		})
			  		.style('stroke', function(d) {
			  			if (excludeValues.indexOf(d.properties[vctProperty]) === -1) {
			  				return colScl(d.properties[vctProperty] / vctDataScale || d.properties[vctProperty])
			  			} else {return 'none'}
			  		});
			}
	  	});

	})

	colScl.type = colorScale; //add type of scale
	return colScl;
}


function plotRaster(container, base, imgFile, dataScale, excludeValues = [], colorScale, colorRange, rScale = 150, sphere = false){

	const clipID = container + 'Clip'

	var container = d3.select('#' + container);

	const path = d3.geoPath().projection(base.projection);

	// make new clip path from graticule.outline 
	const clPath = container.append('clipPath')
		.attr('id', clipID)
		.append('path')
		.attr('id', clipID + 'Path')
		.datum(base.graticule.outline)
		.attr('d', path);

	// get vertices of clip path and use them to exclude points that fall outside of path
	const clipP = d3.select('#' + clipID + 'Path').node().getAttribute('d')
    const ppList = clipP.replace('M', '').replace('Z', '').split('L')
    ppList.forEach(function(d, i){
        ppList[i] = d.split(',').map(v=>+v)
    })

	const colScl = eval('d3.scale' + colorScale + '()'); // outside of data function for export

	d3.json(imgFile, function(error, data) {
		if (error) return console.log(error);

		const rasW = data.width; //raster resolution stored in the json file
		const rasH = data.height; //raster resolution stored in the json file

		//get width and height of layer in projected pixels
		if (sphere === true){

			const mapCenter = base.projection.rotate().map(d=>-d);

			const rasterDims = getGlobeDims(mapCenter, base);
			var projRasterWidth = rasterDims[0];
			var projRasterHeight = rasterDims[1];

			var projCenter = base.projection(mapCenter);

		} else{

			//define the attributes of the layer
			const projCenter = base.projection(data.center);
			const projUlBound = base.projection(data.upLeft);
			const projUrBound = base.projection(data.upRight);
			const projLlBound = base.projection(data.loLeft);
			const projLrBound = base.projection(data.loRight);

			//use the center and get maximum value to account for ill-defined corners
			var projRasterWidth = 2*d3.max([projCenter[0] - projUlBound[0],
											projCenter[0] - projLlBound[0],
											projLrBound[0] - projCenter[0],
											projUrBound[0] - projCenter[0]]);

			var projRasterHeight = 2*d3.max([projCenter[1] - projUlBound[1],
											projCenter[1] - projLlBound[1],
											projLrBound[1] - projCenter[1],
											projUrBound[1] - projCenter[1]]);
		};

		const cellWidth = projRasterWidth / rasW; // number of screen pixels each raster cell is
		const cellHeight = projRasterHeight / rasH;

		const x0 = projCenter[0] - projRasterWidth/2; //raster projected origin x
		const y0 = projCenter[1] - projRasterHeight/2;; //raster projected origin y

		// get only pixel values inside clip path
		var imgDataSet = new Set();
		data.data.forEach(function(d, i){ 
			for (let c = 0; c < d.length; ++c) {
				if(d[c]!==-9999 && excludeValues.indexOf(d[c]) === -1) {
					const cellRow = i;
					const cellCol = c;
					const cellX = x0 + cellCol * cellWidth;
					const cellY = y0 + cellRow * cellHeight;
					if (inside( [cellX, cellY], ppList)) {
						imgDataSet.add(d[c] / dataScale)
					}
				}
			}
		});

		// set to array
		var imgData = [];
		imgDataSet.forEach(v => imgData.push(v));
		//define color scale
		if (colorScale === 'Linear'){
			colScl.interpolate(d3.interpolateHslLong)
				.domain(d3.extent(imgData)).range(colorRange)
		}
		else if (colorScale === 'Ordinal'){
			colScl.domain(imgData.sort(d3.ascending)).range(colorRange)
		};

		imgDataSet = null;
		imgData = null;

		// create the invisible source canvas
		const canvas = d3.select('body').append('canvas')
			.attr('id', 'tmpCanvas').style('display', 'none');
		const ctx = canvas.node().getContext('2d');

		// the following part takes care of the blurriness in retina displays
		const ratio = window.devicePixelRatio || 1;
	    canvas.attr('width', rasW * ratio * rScale) // the physical pixels of the canvas / rendering pixels
	    	.attr('height', rasH * ratio * rScale) 
	    	.style('width', rasW * rScale + 'px') // "visible" pixels
	    	.style('height', rasH * rScale + 'px');

		//define the image
		imageData = ctx.createImageData(rasW, rasH);
		//populate the image (pixels)
		for (let r = 0, l = 0; r < data.data.length; r++){
			for (let c = 0; c < data.data[r].length; c++, l += 4){
				const pc = d3.rgb(colScl(data.data[r][c] / dataScale)); // pixel color

				imageData.data[l + 0] = pc.r;
				imageData.data[l + 1] = pc.g;
				imageData.data[l + 2] = pc.b;
				imageData.data[l + 3] = (data.data[r][c] !== -9999 && excludeValues.indexOf(data.data[r][c]) === -1) ? 255 : 0; //opacity
			}
		};

		const offCtx = canvas.node().cloneNode().getContext('2d'); // create an off screen canvas
		offCtx.putImageData(imageData, 0,0);
		ctx.scale(ratio * rScale, ratio * rScale); // rescale the target context
		ctx.mozImageSmoothingEnabled = false;
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(offCtx.canvas, 0,0);

		//export image
		const ImageD = canvas.node().toDataURL('img/png');
		d3.select('#tmpCanvas').remove() // remove invisible canvas
		//load image
		container.attr('clip-path', 'url(#' + clipID + ')'); //clip parent g element (otherwise transformation will influence the clip path)
		const canvIm = container.append('svg:image')
				.datum(ImageD)
				.attr('xlink:href', function(d) {return d})
				.attr('height', projRasterHeight)
				.attr('width', projRasterWidth)
				.attr('transform', 'translate(' + x0 + ',' + y0 +')');

	});
	colScl.type = colorScale; //add type of scale

	return colScl;
}



////////////////////////////////////////////////////////////////
//function to get the four points of the globe
function getGlobeDims(projC, inProj){

	const cX = projC[0]
	const cY = projC[1]

	if (cX < 90 && cX > -90) {
		var leftPointLon = cX - 90;
		var rightPointLon = cX + 90;
	} else if (cX <= -90){
		var leftPointLon = 180 + (cX + 90);
		var rightPointLon = cX + 90;
	} else if (cX >= 90){
		var leftPointLon = cX - 90;
		var rightPointLon = (cX - 90) - 180;
	}

	var topPointLat = 90 - Math.abs(cY);
	var bottomPointLat = Math.abs(cY) - 90;
	if (cY < 0 && cY >= -90) {
		var topPointLon = cX
		var bottomPointLon = (Math.sign(cX) === -1) ? 180 + cX: cX - 180
	} else if (cY > 0 && cY <= 90) {
		var topPointLon = (Math.sign(cX) === -1) ? 180 + cX: cX - 180
		var bottomPointLon = cX
	}

	const bP = inProj.projection([bottomPointLon, bottomPointLat]);
	const tP = inProj.projection([topPointLon, topPointLat]);
	const lP = inProj.projection([leftPointLon, 0]);
	const rP = inProj.projection([rightPointLon, 0]);

	const projRasterWidth = rP[0] - lP[0];
	const projRasterHeight = bP[1] - tP[1];

	return [projRasterWidth, projRasterHeight]
}

// function to check if point falls within list of points (path)
function inside(point, vs) {
    const x = point[0], y = point[1];

    var inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];

        const intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) {
        	inside = !inside;
        }
    }
    return inside;
};

// function to plot color bar
function plotColBar(container, x, y, width, height, colScale, nOfSections, text, barTextDigits, barTitle, horizontal, cssStyle) {
	
	var container = d3.select('#' + container);
	const leg = container.append('g').attr('id', 'bar');

	// the bar is initially varructed horizontally then rotated
	const nWidth = (horizontal) ? width : height;
	const nHeight = (horizontal) ? height : width;

	// get data extent
	const dataExt = colScale.domain();

	//bar outline 
	leg.append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', nWidth)
		.attr('height', nHeight)
		.style('fill', 'none')
		.style('stroke', 'black')
		.style('stroke-width', 1);

	if (colScale.type === 'Linear') {

		// set number of sections according to arguments
		nOfSections = (nOfSections > nWidth) ? nWidth : nOfSections;
		
		// width of each section
		const sectionSize = nWidth / nOfSections;

		// create list of consecutive numbers
		const values = [];
		for (let i=0; i<nOfSections; ++i) {
			values.push(i)
		};

		leg.selectAll('.colRect')
			.data(values)
		  .enter().append('rect')
		    .attr('x', function (d) {return d*sectionSize; })
		    .attr('y', 0)
			.attr('width', sectionSize)
			.attr('height', nHeight)
			.style('fill', function (d) { return colScale(dataExt[0] + ((dataExt[1] - dataExt[0])/(nOfSections-1))*d) }) // -1 is used for the section to correspond to the last color
			.style('stroke', 'none')
			.style('shape-rendering', 'crispEdges');

		//transform color bar using (real projective space) transformation matrix 
		const matrix = (!horizontal) ? [Math.cos(-90*Math.PI/180), Math.sin(-90*Math.PI/180), -Math.sin(-90*Math.PI/180),  Math.cos(-90*Math.PI/180), x, y  + nWidth] : 0;
		(horizontal) ? leg .attr('transform', 'translate(' + x +',' + y +')') : leg.attr('transform','matrix(' + matrix + ')'); 

		if (text === true) {
			var barText = container.append('g')
			barText.selectAll('.colText')
				.data(dataExt)
			  .enter().append('text')
			  	.attr('class', cssStyle)
			    .text(function (d) {return d.toFixed(barTextDigits) } )
			    .each(function(d,i) {
			    	d3.select(this)
			    		.attr('x', (horizontal) ? x + i*nWidth : x + nHeight + 5 )
			    		.attr('y', (horizontal) ? y + nHeight + 5: y + nWidth - i*nWidth )
			    		.attr('text-anchor', (horizontal) ? 'middle' : 'start')
						.attr('alignment-baseline', (horizontal) ?  'hanging' : 'mathematical');
			    });
		}
	};

	if (colScale.type === 'Ordinal') {
		// set number of sections 
		nOfSections = colScale.domain().length;

		// width of each section
		const sectionSize = nWidth / nOfSections;

		leg.selectAll('.colRect')
			.data(colScale.domain())
		  .enter().append('rect')
		    .attr('x', function (d, i) {return i*sectionSize; })
		    .attr('y', 0)
			.attr('width', sectionSize)
			.attr('height', nHeight)
			.style('fill', function (d) { return colScale(d) })
			.style('stroke', 'none')
			.style('shape-rendering', 'crispEdges');

		//transform color bar using (real projective space) transformation matrix 
		const matrix = (!horizontal) ? [Math.cos(-90*Math.PI/180), Math.sin(-90*Math.PI/180), -Math.sin(-90*Math.PI/180),  Math.cos(-90*Math.PI/180), x, y  + nWidth] : 0;
		(horizontal) ? leg .attr('transform', 'translate(' + x +',' + y +')') : leg.attr('transform','matrix(' + matrix + ')'); 

		if (text === true) {
			var barText = container.append('g')
			barText.selectAll('.colText')
				.data(colScale.domain())
			  .enter().append('text')
			    .attr('class', cssStyle)
			    .text(function (d) {return (typeof d === 'string') ? d: d.toFixed(barTextDigits) } )
			    .each(function(d,i) {
			    	d3.select(this)
			    		.attr('x', (horizontal) ? x + i*sectionSize + sectionSize/2 : x + nHeight + 5 )
			    		.attr('y', (horizontal) ? y + nHeight + 5: y + nWidth -  i*sectionSize - sectionSize/2)
			    		.attr('text-anchor', (horizontal) ? 'middle' : 'start')
						.attr('alignment-baseline', (horizontal) ?  'hanging' : 'central');
			    });
		}
	}
	
	// bar title
	barText.append('text')
		.text(barTitle)
		.attr('class', cssStyle)
		.attr('x', (horizontal) ? x + (nWidth+3)/2 : x + (nHeight+3)/2 )
		.attr('y', y - 7)
		.attr('text-anchor', 'middle');

};













