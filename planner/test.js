var DBQuery = require('../planner/DBQuery');
var sortPOI = require('../planner/sorting').sortPOI;
var planAgent = require('../planner/plan-agent').planAgent;
var turf = require('@turf/turf');


var test = function(){
	//console.log(111);
};

var testPreference = {
	NATURE: 20,
	CULTURE: 50,
	AMUSEMENT: 10,
	SHOPPING: 30,
	NIGHTLIFE: 15,
}

var testData = "waawFroefTW?Gag@@sCHq@l@gCnCaIh@qB^{CZiM\\sChCeG^oAf@eCpA{I`@}AdAyCbD}Hr@wAx@mAlKiK|DmCrBiB`HcIdFgE|@mA|@iBpLi^bTsh@x@qEHoETkCNmF_@cKE_D\\aOCoCp@qDv@aKr@{D`@yAh@eAhLoQ~AsCfHiR~Lk^~C_Ib@cD?_EYkCm@mC_C{GsCaD{EyDaBs@{FmA{LeBsA_@kEuBqBwBmFmHyBmDgByFe@sEYmFaAcDaDaEmB_ByAqBuAyEwAoJ[aFIcONkEhAiNtAoNvAcPhAmKfKyhAx@yGl@cE~AsFhCsF~B_E`DiIhCqIlCcN~@{JR{KIqu@HmB`@eFb@gCdAsEzBkFhAuBrDeEdQwO|CgDli@{t@lEsElCsBxPgIxB_BhEsErB{C|CyGbAgDx@oD^uBlGws@j@iEr@}DdHeXtRuq@|A{G`@kCVoF?yBI}CwFul@IgBBsCJkAb@gCvEoRtA_EtQyYhO}XbCuFb@sA`@_CpCaXnA{GlAuEdAsCbBsDlEgHvE{IlUsh@x@wB`AaDb@aCb@oEh@kNLuN@kQSyEuAgI}BoKcByFgBaFmBsEkFgKcB_DcCuD_ByAcBy@oGsB{Am@oAw@uWcVkCaDaCuDiCkGeAuD}@_Fm@kFeA_NQgEEyELaGD_Ke@aFo@mFsA{NE{CA_C\\yF`@aCnCcLd@mE|@_j@EsBYsDwAaNo@gFs@{C{BeGsBmDqAgByIsJcOiSyDuEiEsE{AqBkEqIaA}AcHsIsBaBmAq@sBu@aAYeJ_BsBQeNV{AT}CxAwDdCeBx@kE~@sEPcJImAIwA]iEmBkCy@_I_AsBa@sC_AcPyHyEyCgGuFoMuN}@s@sHeEaLcJcDqBoCgAaKgC_EoBgIoFaHgGeC_BcBs@mBe@{MsAsB_@mJsE}D_AiAGuJ]wHi@eJc@wAHmATsAl@mEpCgBj@aM~AsE?{[cAoBP}AXqDrAsCxBoBrB}@lA_ErGoBxBiAx@yA~@gHrBwB`AiBpBuC~EwAzAsAVyAWmAmAa@kAI_CLuAp@yAn@k@lE_AvAeAn@gAxAuFx@eEDyAYsBe@{@cA_AiEi@iAs@Ya@YyAI_BD_Ah@aDLkCIeAYaBsA{BwKeHgCgCuAqC}@{CeBaKaAsEUs@cB_D{@eA{GcGyBkCy@aCIy@B{BXqB^_An@{@dCqBlEsCv@w@jBuCh@sAf@gBt@mFD_CAqB}Baa@OsEHuE^_FhCcNHeEEeBcCaOgB}GeBmEwB}D}D}E}AcAyAMq@Jm@Xs@j@a@h@i@hCc@|HKv@_@x@s@j@iAT}A_@i@m@Y_AK_A?{@P_A`@cAdAcBfDgFn@eBXkB?s@Gw@UoAUm@cB_CwCsCsHmFoC}D}@a@oAGoD~@g@@u@Mi@c@_@o@Qm@GwBNy@Ng@Z_@fAi@~AJx@n@|AbBj@V~@JfAYj@y@^_BFs@I}@Ws@a@m@s@k@qLoGmIeEcIkD{Cm@wBBoARiDrAqFxDo@XaJnBeKxCoCd@iBDmDWgBBcH`BmADqAMmLyBeBRiA~@iA~As@^}@Ri@E{@m@Ue@cAkD_BqI]qDCaABqAhAaGd@sDv@oOd@uDrBuJDsCQyE}@_QUgAYkAm@oAk@y@aBmAkBe@_BDqBd@sIrD{DxAo@Ls@F{AQm@Yo@o@o@cAS{@Q}BHcB`AeGH_ACaAMkAm@sCSyC?gAh@_EBoAIyAi@sCu@eBmEsImAyAu@g@cCq@gEm@}VkFsDS_BJaAVeAZoB~AqAdB{DzGcAvAaBnAy@^eBPiBKiDgAcBSmA@sBd@gFxCqKnD_CrAsEdDyEvBoH`CiLrE}A~@eFfEaFrDkBfAyQbI}C~AeBv@wBf@cAh@cEzBmElDiCdAcBf@uFd@eBZiEvByIlFkCrAeAZuDb@s\\@cBNoRfEgBToRX{D^cLbCgPxCuRtA}ERwCEsWsEaa@gIuN{C{Cs@iBs@ec@aT}AmAyAkByGuLsAaB}A{AyAeA_By@iCy@}b@yKmBm@uC_B}YaS{HiGkE{EuCeEiCsEiAmCyPke@cDkG{GkJyAyA_CgBge@}XsDsAoBe@mEe@kcAmDaCm@mPgGoKeE}CgBoKsJoCiB{Ak@gBa@wFeAiA_@wE}BiC{@}Gy@uGqAsFoCcC_BwD_E_CyCwHcLiAsA}AsAkAcAqBmAsB_AmEaBuASqEc@eBAyMdA_U`CaHLiQ_CeOBeDM{FiAmB{@qI_DcFeAk`@uDqHEaYjEsHz@qD?mDm@qZuLcHsByB]eDSiF?mGd@gh@fIiEx@gClA}@l@uRfQwD`EaIlFqBjAmElBuYrIqcB`e@qk@`PoOrEwJhEmnBn_AodArg@";

// var pt = turf.point([0, 0]);
// var line = turf.lineString([[1, 1],[0, 0],[-1, 1]]);

// var distance = turf.pointToLineDistance(pt, line, {units: 'miles'});

// console.log(distance);
exports.test = test;