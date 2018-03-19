var directionsAgent = require('../planner/googleExtention').googleMapsClient.directions;
var turf = require('@turf/turf');
var PL = require('../planner/polyline');
var POI = require('../planner/DBQuery').getPOIInBuffer
var Byway = require('../planner/DBQuery').getBywayInBuffer

var planAgent = function(input){
	/* input: {
		origin: [lat, lng] / name / address,
		destination: [lat, lng] / name / address,
		preference: {},
		duration: Number,
		waypoints: [{lat, lng} / 'String']
	} */
	
	var routerequest = {
		origin: input.origin,
		destination: input.destination,
		waypoints: input.waypoints,
		mode: 'driving',
		optimize: true
	}
	
	return new Promise(function(resolve, reject){
		var test = "ixtfEx_bjUm|DxrDwwGbjBgbJjrD}eLk\\qia@t}L_uQfbJebIbrHwfLlvK}wL~nPwpJvuIcgEbpIuxGyz@qjNdx@ifOtnOczOx|S{lMvzMe}N`kZyuQxlOwsBfrIgnEiJa}KbkJugM``LetGvoO_e[bi[{rJvrGy}HvrA{{LdcLeoFtiBgnD|`FwgMltHkuH}AwqD`dFajBlrHejC{bBalHt|Dg~BrxCiaGzr@g`NxvCe_Np_Oqzs@|g|@olm@b`x@qnKvkHsn_@tfWsh`@|o_@eeG|mLqmXf_[_qs@nwg@_pf@pek@myt@`{f@mq[jb\\afRnrMmbTjuFqva@`|Mgn[z_`@apWlHo}EsUqeCqwD_gPqjEq~MxjCssCxlFahMj|DioMx_EeiKbEa`Z`uK}i]fuFcyEplBgtDc`AugE{PgrEsGcdKdmEqd@h_`@ulCjvIciObgRuiSdzTqe_Azdg@uxYxwA{iU`DiqIppBk}Mu\\qk[sT_rMac@sv{@tuBo{Lp}BqoOlwEkoa@hvCk`OxnI}zKx{@}~Na`BqnK_yCqfGiBkrIj|BknChoDa|FhqBu}GboHigIwbDoxLepI{tKqnFm_DuzBefGerCu|CecAkvBtu@g_KpmIskNl`JyhBtAuqAzkF}ePtjIkmMftD_}IbtEanEtaQ}dE~jAyeD_mAifB{yCwaCufCcwDkSajKmeBk`KdqBenItbDyzCfs@qiFq~@opJhf@qlS~{O}oRbc\\wgMfhKgtDzmLa}BdiQrdAnbHpv@nbEygCh`Dvj@rgJsbAfxIymHp|LexQ~bCw}Ij\\cbD}|@iwCzfBypDkeCwaCgKy_Ec}JgkE__JkqAfr@wpEs`@ytEeyAwnJtlHsiBx}EahF{P}pDguCk{@`_EkuLjcFsnOvWoqOgvA{tMaeD{wDly@_|GisBguHcMw`EtJ{wDsuCamMskMwwI{rBypFhImq@`wAu_DebD_`Bq`HwsCe}OiyNm~FyxQat@sfJdjAkvDpgDayq@ljAirqA}i@qfZutGkfFk{Ck_P|_AehQmeGajf@ozb@ai_@sjF_rCmuG_kCsrAwvCih@}wD|cAumHpc@giFqyBy_Tg^w~WnjH_pLzrJcoLbgNmvHdwB}uSpqFkuPgxB_lMrhDye^mdEapNwJ_cFtkD_mJtkMc_Gwe@obG~j@o|K|pCg_Ug_JsbRgyFgcEg}PqwEs|^mtGckUapImdM_oG}Cw[upDur@q|Pq}MobHmsKud@_`JudCivGvHwgIxeDmvL~dEJdU";
		var polyline = PL.PLDecoder(test);
		var buffer = PL.polylineToBuffer(test, 100);
		var subLines = PL.PLDivider(polyline, 20);
		var queryPool = []
		var subBuffer = subLines.map(function(l){
			var sb = PL.polylineToBuffer(l, 100);
			queryPool.push(POI(sb, 500));
			return sb;
		});
		
		Promise.all(queryPool)
			.then(function(pois){
					var POI_rare = {};
					pois.forEach(function(list){
						list.forEach(function(poi){
							POI_rare[poi._id] = poi;
						});
					});
				var pois = Object.keys(POI_rare).map(function(id){
					return POI_rare[id];
				});
				
				Byway(buffer, 1000)
				.then(function(byway){
					var way = byway.map(function(way){
						console.log(PL.PLReformat(way.path));
						return PL.PLDecoder(way.path);
					});
					resolve({
						//result: result,
						polyline: polyline,
						buffer: buffer,
						pois: pois,
						subbuffer: subBuffer,
						subline: subLines,
						byway: way
					});
				})
				.catch(function(exception){
					console.log(exception);
				});
				
				
				
			})
			.catch(function(exception){
				console.log(exception);
			});
		
		
		/* directionsAgent(routerequest, function(err, result) {
			if(err)
				reject(err);
			else{
				var polyline = PL.PLDecoder(result.json.routes[0].overview_polyline.points);
				var buffer = PL.polylineToBuffer(result.json.routes[0].overview_polyline.points, 100);
				
				POI(buffer, 500)
					.then(function(pois){
						resolve({
							result: result,
							polyline: polyline,
							buffer: buffer,
							pois: pois,
							//subbuffer: subBufferList
						});
					})
					.catch(function(exception){
						console.log(exception);
					});
			}
		}); */
	});
};

exports.planAgent = planAgent