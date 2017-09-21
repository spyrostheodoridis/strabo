function plotMap(o){

	//create template
	var main = d3.select('body').append('svg').attr('width', o.MainWidth).attr('height', o.MainHeight);
	main.append('rect').attr('width', o.MainWidth).attr('height', o.MainHeight).attr('x', 0).attr('y', 0).style('fill','none').style('stroke', 'black');
		
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	//>>>>>>>>>>>>>>>>>>>>>> define projection and outline >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	var projection = o.projection;
	projection.scale(1).translate([0,0]);
	// if a projected img is imported for canvas, do not rotate the map, leave it to default prime meridian, unless the img has been centered using the same meridian as the base map
	//if (plotCanvas == false) {
	//	projection.rotate([-(extentBounds[1][0] + extentBounds[0][0]) / 2, 0.000001, 0.00001]); // the small number is a hack
	//};

	var path = d3.geoPath().projection(projection);
	var graticule = d3.geoGraticule();
	graticule.extent([o.extentBounds[0], o.extentBounds[1]]).step([10, 10]);
	// initial bounding box of the defined extent for the defined projection
	var clPath0 = main.append("clipPath").append('path').datum(graticule.outline).attr('d', path);
	var initBox = clPath0.node().getBBox();
	// redefine scale and translate
	const s = .95 / Math.max( initBox.width / o.MainWidth, initBox.height / o.MainHeight);
	const t = [ (o.MainWidth - s*(2*initBox.x + initBox.width )) / 2, (o.MainHeight - s*(2*initBox.y + initBox.height )) / 2];
	projection.scale(s).translate(t);

	// make new clip path from graticule.outline 
	var clPath = main.append("clipPath").attr('id', 'outClip').append('path').datum(graticule.outline).attr('d', path);
	// get vertices of path list
	var pathP = clPath.node().pathSegList;
	var ppList = []
	for (let i = 0; i < pathP.numberOfItems - 1; ++i) {
		ppList.push([pathP.getItem(i).x, pathP.getItem(i).y])
	}

	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	//>>>>>>>>>>>>>>>>>>>>>> define order of layers >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	var grat = main.append('g');
	var base = main.append('g');
	var baseImage = main.append('g');
	var canvasIMG = main.append('g');
	var vectLayer = main.append('g');
	var borders = main.append('g');
	var pointLayer = main.append('g');
	var scaleBar = main.append('g');
	var gratText = main.append('g');
	var colorBars = main.append('g');

	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	//>>>>>>>>>>>>>>>>>>>>>> scale bar >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

	if (o.plotScale == true) {
		// harvesine formula ==> solve for dλ
		var NewLon = o.Lon0 + (o.dx / o.earthR) * (180 / Math.PI) / Math.cos(o.Lat0 * Math.PI / 180 );
		var sclBarCoord1 = projection([o.Lon0 + o.scaleBarOff[0], o.Lat0 + o.scaleBarOff[1]]);
	    var sclBarCoord2 = projection([NewLon + o.scaleBarOff[0], o.Lat0 + o.scaleBarOff[1]]);

	    scaleBar.append('line').attr('x1', sclBarCoord1[0]).attr('y1', sclBarCoord1[1]).attr('x2', sclBarCoord2[0]).attr('y2', sclBarCoord2[1])
	     	.attr('class', 'scaleBar');

	    var scaleText = scaleBar.append('text').text(o.dx + 'km').attr('y', sclBarCoord2[1]+15)
	    var bboxScaleT = scaleText.node().getBBox();
	    scaleText.attr('x', sclBarCoord1[0] + (sclBarCoord2[0] - sclBarCoord1[0])/2 - bboxScaleT.width/2);
	};

	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	//>>>>>>>>>>>>>>>>>>>>>>> load topojson base map >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	d3.json(o.BaseMap, function (error, topology) {
		if (error) return console.log(error); 

		var topoData = topojson.feature(topology, topology.objects.world_10m);

		//plot graticule and boarder lines
		if (o.plotGraticule === true) { grat.append('path').datum(graticule).attr('class', 'graticule').attr('d', path); }

		if (o.plotOutline === true) { grat.append('path').datum(graticule.outline).attr('class', 'graticule').attr('d', path); }

		if (o.plotCountryBoarders === true){ borders.append('path')
			.datum(topojson.mesh(topology, topology.objects.world_10m, function (a,b) {return a !== b; }))
			.attr('d', path).attr('clip-path', 'url(#outClip)').attr('class', 'mapBoarders'); }

		if (o.plotCoast === true){ borders.append('path')
			.datum(topojson.mesh(topology, topology.objects.world_10m, function (a,b) {return a === b; }))
			.attr('d', path).attr('clip-path', 'url(#outClip)').attr('class', 'mapBoarders'); }

		if (o.plotBase === true){ base.append('path').datum(topoData).attr('d', path).attr('clip-path', 'url(#outClip)')
			.attr('class', 'baseMap'); }

		if (o.plotGratText === true) {
			gratText.selectAll('text').data(graticule.lines())
	  			.enter().append('text')
	    			.attr('class', 'lonLatLabels')
	    			.text(function(d) {
						if (d.coordinates[0][0] === d.coordinates[1][0]) {return d.coordinates[0][0]; }
						else if ((d.coordinates[0][1] === d.coordinates[1][1])) {return d.coordinates[0][1]; }
					})
					.attr('dx', function(d) { if (d.coordinates[0][1] === d.coordinates[1][1]) {return '-1.3em';}
											else { return '-0.5em';}})
					.attr('dy', function(d) { if (d.coordinates[0][0] === d.coordinates[1][0]) {return '1em';}
											else { return '0em';}})
					.attr('transform' , function(d) {
						lineCoord = projection(d.coordinates[0])
						if (lineCoord[1] > o.MainWidth) {return 'translate(' + lineCoord[0] + ',' + projection([0, -85])[1] +')' }
						else {return 'translate(' + lineCoord[0] + ',' +  lineCoord[1] +')'} 
					});
		}
	});
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	//>>>>>>>>>>>>>>>>>>>>>>> load image >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	if (o.plotBaseImage === true) {

	 	const baseImgLl = projection(o.baseImgBounds[0]);
	 	const baseImgUr = projection(o.baseImgBounds[1]);
	  	//width and height of image in projected pixels
	 	var baseImgDims = [baseImgUr[0] - baseImgLl[0], baseImgUr[1] - baseImgLl[1]];

		baseImage.append('svg:image').attr('x', baseImgLl[0]).attr('y', baseImgUr[1])
			.attr('xlink:href', o.baseImageLayer).attr('width', Math.abs(baseImgDims[0])).attr('height', Math.abs(baseImgDims[1]))
			.attr('clip-path', 'url(#outClip)');

	};
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	//>>>>>>>>>>>>>>>>>>>>>>> load image (raster file) >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	if (o.plotCanvas === true) {
		d3.json(o.canvasSrc, function(error, data) {
			if (error) return console.log(error);

			//define the attributes of the layer
			const projUlBound = projection(data.upLeft);
			const projUrBound = projection(data.upRight);
			const projLlBound = projection(data.loLeft);
			const projLrBound = projection(data.loRight);
			//max width and height of layer in projected pixels
			const projRasterWidth = d3.max([projUrBound[0] - projUlBound[0], projUrBound[0] - projLlBound[0],
										  projLrBound[0] - projUlBound[0], projLrBound[0] - projLlBound[0]]);

			const projRasterHeight = d3.max([projLlBound[1] - projUlBound[1], projLlBound[1] - projUrBound[1],
										  projLrBound[1] - projUlBound[1], projLrBound[1] - projUrBound[1]]);

			const rasW = data.width; //raster resolution stored in the json file
			const rasH = data.height; //raster resolution stored in the json file
			const x0 = projUlBound[0]; //raster projected origin x
			const y0 = projUlBound[1]; //raster projected origin y

			const cellWidth = projRasterWidth / rasW;
			const cellHeight = projRasterHeight / rasH;
			// get only pixel values inside clip path
			const datExt = d3.extent(data.data, function(d, i){ 
				if(d!==-9999) {
					var cellRow = Math.ceil(i / rasW);
					var cellCol = i % rasW;
					var cellX = x0 + cellCol * cellWidth;
					var cellY = y0 + cellRow * cellHeight;
					if (inside( [cellX, cellY], ppList) ) {
						return d
					}
				} 
			});
			o.colMapImg.domain(datExt);

			// create the source canvas
			var canvas = d3.select('body').append('canvas').style('display', 'none');
			var ctx = canvas.node().getContext("2d");

			const scale = o.rScale; // the higher the number the crisper the cells
			// the following part takes care of the blurriness in retina displays
			const ratio = window.devicePixelRatio || 1;
		    canvas.attr('width', rasW * ratio * scale) // the physical pixels of the canvas / rendering pixels
		    	.attr('height', rasH * ratio * scale) // the physical pixels of the canvas / rendering pixels
		    	.style('width', rasW * scale + 'px') // pixels for visualization
		    	.style('height', rasH * scale + 'px'); // pixels for visualization

			//define the image
			var imageData = ctx.createImageData(rasW, rasH);
			//populate the image (pixels)
			for (let j = 0, k = 0, l = 0; j < rasH; ++j) {
				for (let i = 0; i < rasW; ++i, ++k, l += 4) {
					const c = d3.rgb(o.colMapImg(data.data[k])); // pixel color
					imageData.data[l + 0] = c.r;
					imageData.data[l + 1] = c.g;
					imageData.data[l + 2] = c.b;
					if (data.data[k] !== -9999) { 
						imageData.data[l + 3] = 255; //opacity
					} else { imageData.data[l + 3] = 0; } 
				}
			};

			var offCtx = canvas.node().cloneNode().getContext('2d'); // create an off screen canvas
			offCtx.putImageData(imageData, 0,0);
			ctx.scale(ratio * scale, ratio * scale); // rescale the target context
			ctx.mozImageSmoothingEnabled = false;
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(offCtx.canvas, 0,0);

			//export image
			var ImageD = canvas.node().toDataURL("img/png");
			//load image
			canvasIMG.attr('clip-path', 'url(#outClip)'); //clip parent g element (otherwise transformation will influence the clip path)
			var canvIm = canvasIMG.append("svg:image").datum(ImageD).attr("xlink:href", function(d) {return d})
					.attr("height", projRasterHeight).attr("width", projRasterWidth)
					.attr("transform", "translate(" + x0 + "," + y0 +")");

			plotColBar(colorBars, o.rBarX, o.rBarY, 100, 20, 100, datExt, o.colMapImg);
		}		
	)};

	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	//>>>>>>>>>>>>>>>>>>>>>>> load topojson layer >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	if (o.plotVectorLayer === true) {
		d3.json(o.vectLayerScr, function(error, vData) {
		if (error) return console.log(error);

		if (o.vctFormat === 'tJson') {
			var topoData = topojson.feature(vData, vData.objects.outCells).features
			// get extent, exclude areas outside of clip path
			const vctExt = d3.extent(topoData, function(d) { if (turf.intersect(d, graticule.outline())) {return d.properties.DN;} });
			o.colMapVct.domain(vctExt)

			vectLayer.selectAll('path')
	  		.data(topoData)
		  .enter().append('path')
	  		.attr('d', path)
	  		.attr('clip-path', 'url(#outClip)')
	  		.style('fill', function(d) {return o.colMapVct(d.properties.DN);})
	  		.style('stroke', function(d) {return o.colMapVct(d.properties.DN);});

	  	plotColBar(colorBars, o.vBarX, o.vBarY, 100, 20, 100, vctExt, o.colMapVct);

		} else if (o.vctFormat === 'gJson') {
			var features = vData.features;
			// get extent, exclude areas outside of clip path
			const vctExt = d3.extent(features, function(d) { if (turf.intersect(d, graticule.outline())) {return d.properties.DN;} });
			o.colMapVct.domain(vctExt);

	  		vectLayer.selectAll('path')
	      		.data(features)
	    	  .enter().append('path')
	      		.attr('d', path)
	      		.attr('clip-path', 'url(#outClip)')
	      		.style('fill', function(d) {return o.colMapVct(d.properties.DN);})
	      		.style('stroke', function(d) {return o.colMapVct(d.properties.DN);});

	      	plotColBar(colorBars, o.vBarX, o.vBarY, 100, 20, 100, vctExt, o.colMapVct);
			
			};
		})
	}

	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> plot points >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	if (o.plotPoints === true) {
		d3.csv(o.pointFile, function (error, data) {
			if (error) return console.log(error);

			if (o.colorPoints === true) {
				var pointsExtent = d3.extent(data, function(d) { 
					const pointCoord = projection([+d.x, +d.y]);
					if (inside(pointCoord, ppList)) {
						return +d[o.colorVar]
					}
				})
				o.colPoint.domain(pointsExtent)
				plotColBar(colorBars, o.pBarX, o.pBarY, 100, 20, 100, pointsExtent, o.colPoint);
			};

			pointLayer.selectAll('points').data(data).enter().append('circle').attr('clip-path', 'url(#outClip)').attr('r', 5).attr('class', 'points')
				.each(function(d) {
					d.x = +d.x
					d.y = +d.y
					var lonlat = projection([d.x, d.y])
					d3.select(this).attr('cx', lonlat[0]).attr('cy', lonlat[1]);
					if (o.colorPoints === true) { d3.select(this).style('fill', function (d) {return o.colPoint(+d[o.colorVar])});
					};
				})
		})
	}
};

// function to check if cell falls within clip path
function inside(point, vs) {
    var x = point[0], y = point[1];

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

// function to plot color bar
function plotColBar(container, x, y, width, height, sections, dataExt, colScale, text = true) {
	var values = [];
	if (sections > width) { var sections = width; } // correct number of sections in case they are more than the width pixels
	const sectionWidth = width / sections;
	for (let i=0; i<sections; ++i) {
		values.push(i)
	}

	container.selectAll('.sRect').data(values).enter().append('rect').attr('x', function (d) {return x + d*sectionWidth }).attr('y', y)
		.attr('width', sectionWidth).attr('height', height)
		.style('fill', function (d) { return colScale(dataExt[0] + ((dataExt[1] - dataExt[0])/(sections-1))*d) }) // -1 is used for the section to correspond to the last color
		.style('stroke-width', 0).style('shape-rendering', 'crispEdges');

	if (text === true) {
		container.selectAll('.colText').data(dataExt).enter().append('text').text(function (d) {return d.toFixed(2)} ) 
			.attr('x', function (d,i) {return x + i*width} ).attr('y', y + height + 10).attr('dx', '-0.1em');
	}
};