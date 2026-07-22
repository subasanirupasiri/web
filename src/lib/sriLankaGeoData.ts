export interface SubLocation {
  id: string;
  name: string;
  nameSi: string;
  lat: number;
  lng: number;
}

export interface DistrictGeoData {
  id: string; // LK ID from SVG e.g. LK21
  name: string;
  nameSi: string;
  centroid: { lat: number; lng: number; cx: number; cy: number };
  viewBox: string; // SVG viewbox for zooming into this district e.g. "390 570 170 160"
  subLocations: SubLocation[];
}

export const SRI_LANKA_DISTRICTS: Record<string, DistrictGeoData> = {
  LK21: {
    id: "LK21",
    name: "Kandy",
    nameSi: "මහනුවර",
    centroid: { lat: 7.2906, lng: 80.6337, cx: 469.1, cy: 641.6 },
    viewBox: "390 570 170 160",
    subLocations: [
      { id: "kandy_city", name: "Kandy City", nameSi: "මහනුවර නගරය", lat: 7.2906, lng: 80.6337 },
      { id: "gampola", name: "Gampola", nameSi: "ගම්පොළ", lat: 7.1646, lng: 80.5694 },
      { id: "digana", name: "Digana", nameSi: "දිගන", lat: 7.3061, lng: 80.7511 },
      { id: "peradeniya", name: "Peradeniya", nameSi: "පේරාදෙණිය", lat: 7.2662, lng: 80.5977 },
      { id: "nawalapitiya", name: "Nawalapitiya", nameSi: "නාවලපිටිය", lat: 7.0506, lng: 80.5367 },
      { id: "kundasale", name: "Kundasale", nameSi: "කුණ්ඩසාලේ", lat: 7.2882, lng: 80.6868 },
    ],
  },
  LK11: {
    id: "LK11",
    name: "Colombo",
    nameSi: "කොළඹ",
    centroid: { lat: 6.9271, lng: 79.8612, cx: 310.9, cy: 740.3 },
    viewBox: "270 690 130 110",
    subLocations: [
      { id: "colombo_fort", name: "Colombo Fort", nameSi: "කොළඹ කොටුව", lat: 6.9344, lng: 79.8428 },
      { id: "dehiwala", name: "Dehiwala", nameSi: "දෙහිවල", lat: 6.8511, lng: 79.8659 },
      { id: "maharagama", name: "Maharagama", nameSi: "මහරගම", lat: 6.8480, lng: 79.9265 },
      { id: "avissawella", name: "Avissawella", nameSi: "අවිස්සාවේල්ල", lat: 6.9538, lng: 80.2078 },
      { id: "homagama", name: "Homagama", nameSi: "හෝමාගම", lat: 6.8436, lng: 80.0031 },
    ],
  },
  LK23: {
    id: "LK23",
    name: "Nuwara Eliya",
    nameSi: "නුවරඑළිය",
    centroid: { lat: 6.9497, lng: 80.7891, cx: 485.0, cy: 707.2 },
    viewBox: "420 650 150 140",
    subLocations: [
      { id: "kotmale_maswela", name: "Kotmale (Maswela)", nameSi: "කොත්මලේ (මස්වෙල)", lat: 7.0428, lng: 80.5950 },
      { id: "nuwara_eliya_town", name: "Nuwara Eliya Town", nameSi: "නුවරඑළිය නගරය", lat: 6.9497, lng: 80.7891 },
      { id: "hatton", name: "Hatton", nameSi: "හැටන්", lat: 6.8928, lng: 80.5971 },
      { id: "maskeliya", name: "Maskeliya", nameSi: "මස්කෙළිය", lat: 6.8344, lng: 80.5847 },
      { id: "nanu_oya", name: "Nanu Oya", nameSi: "නානුඔය", lat: 6.9386, lng: 80.7483 },
      { id: "talawakele", name: "Talawakele", nameSi: "තලවකැලේ", lat: 6.9372, lng: 80.6558 },
    ],
  },
  LK41: {
    id: "LK41",
    name: "Jaffna",
    nameSi: "යාපනය",
    centroid: { lat: 9.6615, lng: 80.0255, cx: 377.9, cy: 81.3 },
    viewBox: "230 10 260 160",
    subLocations: [
      { id: "jaffna_town", name: "Jaffna Town", nameSi: "යාපනය නගරය", lat: 9.6615, lng: 80.0255 },
      { id: "point_pedro", name: "Point Pedro", nameSi: "පේදුරුතුඩුව", lat: 9.8167, lng: 80.2333 },
      { id: "chavakachcheri", name: "Chavakachcheri", nameSi: "චාවකච්චේරිය", lat: 9.6554, lng: 80.1583 },
      { id: "velanai", name: "Velanai", nameSi: "වෙලනෙයි", lat: 9.6333, lng: 79.9000 },
    ],
  },
  LK31: {
    id: "LK31",
    name: "Galle",
    nameSi: "ගාල්ල",
    centroid: { lat: 6.0535, lng: 80.2210, cx: 375.2, cy: 890.9 },
    viewBox: "310 820 150 140",
    subLocations: [
      { id: "galle_fort", name: "Galle Fort", nameSi: "ගාල්ල කොටුව", lat: 6.0535, lng: 80.2210 },
      { id: "hikkaduwa", name: "Hikkaduwa", nameSi: "හික්කඩුව", lat: 6.1394, lng: 80.1030 },
      { id: "ambalangoda", name: "Ambalangoda", nameSi: "අම්බලන්ගොඩ", lat: 6.2361, lng: 80.0544 },
      { id: "elpitiya", name: "Elpitiya", nameSi: "ඇල්පිටිය", lat: 6.2575, lng: 80.1417 },
      { id: "bentota", name: "Bentota", nameSi: "බෙන්තොට", lat: 6.4239, lng: 79.9983 },
    ],
  },
  LK53: {
    id: "LK53",
    name: "Trincomalee",
    nameSi: "ත්‍රිකුණාමලය",
    centroid: { lat: 8.5874, lng: 81.2152, cx: 566.7, cy: 325.6 },
    viewBox: "500 230 180 180",
    subLocations: [
      { id: "trinco_town", name: "Trincomalee Town", nameSi: "ත්‍රිකුණාමලය නගරය", lat: 8.5874, lng: 81.2152 },
      { id: "kinniya", name: "Kinniya", nameSi: "කින්නියා", lat: 8.4975, lng: 81.1894 },
      { id: "mutur", name: "Mutur", nameSi: "මුතුර්", lat: 8.4554, lng: 81.2657 },
      { id: "nilaveli", name: "Nilaveli", nameSi: "නිලාවේලි", lat: 8.6872, lng: 81.1878 },
    ],
  },
  LK71: {
    id: "LK71",
    name: "Anuradhapura",
    nameSi: "අනුරාධපුරය",
    centroid: { lat: 8.3114, lng: 80.4037, cx: 441.7, cy: 392.5 },
    viewBox: "380 320 200 180",
    subLocations: [
      { id: "anuradhapura_town", name: "Anuradhapura Town", nameSi: "අනුරාධපුර නගරය", lat: 8.3114, lng: 80.4037 },
      { id: "mihintale", name: "Mihintale", nameSi: "මිහින්තලේ", lat: 8.3542, lng: 80.5050 },
      { id: "kekirawa", name: "Kekirawa", nameSi: "කැකිරාව", lat: 8.0411, lng: 80.5892 },
      { id: "epawala", name: "Eppawala", nameSi: "ඇප්පාවල", lat: 8.1408, lng: 80.4136 },
    ],
  },
  LK81: {
    id: "LK81",
    name: "Badulla",
    nameSi: "බදුල්ල",
    centroid: { lat: 6.9934, lng: 81.0550, cx: 568.3, cy: 703.3 },
    viewBox: "520 630 160 170",
    subLocations: [
      { id: "badulla_town", name: "Badulla Town", nameSi: "බදුල්ල නගරය", lat: 6.9934, lng: 81.0550 },
      { id: "bandarawela", name: "Bandarawela", nameSi: "බණ්ඩාරවෙල", lat: 6.8317, lng: 80.9844 },
      { id: "ella", name: "Ella", nameSi: "ඇල්ල", lat: 6.8667, lng: 81.0466 },
      { id: "haputale", name: "Haputale", nameSi: "හපුතලේ", lat: 6.7686, lng: 80.9639 },
      { id: "mahiyanganaya", name: "Mahiyanganaya", nameSi: "මහියංගණය", lat: 7.3178, lng: 81.0022 },
    ],
  },
  LK91: {
    id: "LK91",
    name: "Ratnapura",
    nameSi: "රත්නපුර",
    centroid: { lat: 6.6828, lng: 80.4014, cx: 450.9, cy: 802.5 },
    viewBox: "360 730 190 150",
    subLocations: [
      { id: "ratnapura_town", name: "Ratnapura Town", nameSi: "රත්නපුර නගරය", lat: 6.6828, lng: 80.4014 },
      { id: "balangoda", name: "Balangoda", nameSi: "බලන්ගොඩ", lat: 6.6500, lng: 80.7000 },
      { id: "embilipitiya", name: "Embilipitiya", nameSi: "ඇඹිලිපිටිය", lat: 6.3428, lng: 80.8483 },
      { id: "kuruwita", name: "Kuruwita", nameSi: "කුරුවිට", lat: 6.7725, lng: 80.3667 },
    ],
  },
  LK33: {
    id: "LK33",
    name: "Hambantota",
    nameSi: "හම්බන්තොට",
    centroid: { lat: 6.1247, lng: 81.1185, cx: 578.3, cy: 874.0 },
    viewBox: "470 820 220 150",
    subLocations: [
      { id: "hambantota_town", name: "Hambantota Town", nameSi: "හම්බන්තොට නගරය", lat: 6.1247, lng: 81.1185 },
      { id: "tangalle", name: "Tangalle", nameSi: "තංගල්ල", lat: 6.0242, lng: 80.7942 },
      { id: "tissamaharama", name: "Tissamaharama", nameSi: "තිස්සමහාරාමය", lat: 6.2828, lng: 81.2869 },
      { id: "ambalantota", name: "Ambalantota", nameSi: "අම්බලන්තොට", lat: 6.1228, lng: 81.0256 },
    ],
  },
  LK51: {
    id: "LK51",
    name: "Batticaloa",
    nameSi: "මඩකලපුව",
    centroid: { lat: 7.7170, lng: 81.7000, cx: 657.2, cy: 518.9 },
    viewBox: "610 400 160 200",
    subLocations: [
      { id: "batti_town", name: "Batticaloa Town", nameSi: "මඩකලපුව නගරය", lat: 7.7170, lng: 81.7000 },
      { id: "kattankudy", name: "Kattankudy", nameSi: "කාත්තන්කුඩි", lat: 7.6833, lng: 81.7167 },
      { id: "valachchenai", name: "Valachchenai", nameSi: "වාලච්චේන", lat: 7.9167, lng: 81.5333 },
    ],
  },
  LK52: {
    id: "LK52",
    name: "Ampara",
    nameSi: "අම්පාර",
    centroid: { lat: 7.2833, lng: 81.6667, cx: 716.3, cy: 653.0 },
    viewBox: "630 550 170 240",
    subLocations: [
      { id: "ampara_town", name: "Ampara Town", nameSi: "අම්පාර නගරය", lat: 7.2833, lng: 81.6667 },
      { id: "kalmunai", name: "Kalmunai", nameSi: "කල්මුණේ", lat: 7.4167, lng: 81.8333 },
      { id: "akkaraipattu", name: "Akkaraipattu", nameSi: "අක්කරපත්තුව", lat: 7.2167, lng: 81.8500 },
      { id: "pottuvil", name: "Pottuvil", nameSi: "පොතුවිල්", lat: 6.8667, lng: 81.8333 },
    ],
  },
  LK42: {
    id: "LK42",
    name: "Kilinochchi",
    nameSi: "කිලිනොච්චිය",
    centroid: { lat: 9.3803, lng: 80.3975, cx: 388.3, cy: 151.3 },
    viewBox: "320 100 200 110",
    subLocations: [
      { id: "kilinochchi_town", name: "Kilinochchi Town", nameSi: "කිලිනොච්චි නගරය", lat: 9.3803, lng: 80.3975 },
      { id: "paranthan", name: "Paranthan", nameSi: "පරන්තන්", lat: 9.4333, lng: 80.4000 },
      { id: "poonakary", name: "Poonakary", nameSi: "පූනරීන්", lat: 9.5000, lng: 80.2000 },
    ],
  },
  LK43: {
    id: "LK43",
    name: "Mannar",
    nameSi: "මන්නාරම",
    centroid: { lat: 8.9810, lng: 79.9044, cx: 337.0, cy: 272.4 },
    viewBox: "240 180 200 160",
    subLocations: [
      { id: "mannar_town", name: "Mannar Town", nameSi: "මන්නාරම නගරය", lat: 8.9810, lng: 79.9044 },
      { id: "madhu", name: "Madhu", nameSi: "මඩු", lat: 8.8500, lng: 80.2000 },
      { id: "nanattan", name: "Nanattan", nameSi: "නනාට්ටාන්", lat: 8.8333, lng: 79.9667 },
    ],
  },
  LK44: {
    id: "LK44",
    name: "Vavuniya",
    nameSi: "වවුනියාව",
    centroid: { lat: 8.7514, lng: 80.4971, cx: 437.7, cy: 253.3 },
    viewBox: "380 210 160 140",
    subLocations: [
      { id: "vavuniya_town", name: "Vavuniya Town", nameSi: "වවුනියාව නගරය", lat: 8.7514, lng: 80.4971 },
      { id: "cheddikulam", name: "Cheddikulam", nameSi: "චෙට්ටිකුලම", lat: 8.6667, lng: 80.3167 },
      { id: "nedunkeni", name: "Nedunkeni", nameSi: "නෙඩුන්කේණි", lat: 8.9333, lng: 80.6500 },
    ],
  },
  LK45: {
    id: "LK45",
    name: "Mullaitivu",
    nameSi: "මුලතිව්",
    centroid: { lat: 9.2671, lng: 80.8142, cx: 452.5, cy: 183.2 },
    viewBox: "400 130 160 140",
    subLocations: [
      { id: "mullaitivu_town", name: "Mullaitivu Town", nameSi: "මුලතිව් නගරය", lat: 9.2671, lng: 80.8142 },
      { id: "puthukkudiyiruppu", name: "Puthukkudiyiruppu", nameSi: "පුදුකුඩිඉරිප්පු", lat: 9.3000, lng: 80.6833 },
      { id: "mankulam", name: "Mankulam", nameSi: "මාන්කුලම", lat: 9.1333, lng: 80.4333 },
    ],
  },
  LK61: {
    id: "LK61",
    name: "Kurunegala",
    nameSi: "කුරුණෑගල",
    centroid: { lat: 7.4863, lng: 80.3623, cx: 382.6, cy: 552.1 },
    viewBox: "300 480 200 180",
    subLocations: [
      { id: "kurunegala_town", name: "Kurunegala Town", nameSi: "කුරුණෑගල නගරය", lat: 7.4863, lng: 80.3623 },
      { id: "kuliyapitiya", name: "Kuliyapitiya", nameSi: "කුලියාපිටිය", lat: 7.4689, lng: 80.0403 },
      { id: "pannala", name: "Pannala", nameSi: "පන්නල", lat: 7.3333, lng: 79.9833 },
      { id: "wariyapola", name: "Wariyapola", nameSi: "වාරියපොළ", lat: 7.6167, lng: 80.2667 },
    ],
  },
  LK62: {
    id: "LK62",
    name: "Puttalam",
    nameSi: "පුත්තලම",
    centroid: { lat: 8.0362, lng: 79.8283, cx: 314.5, cy: 454.3 },
    viewBox: "240 330 180 260",
    subLocations: [
      { id: "puttalam_town", name: "Puttalam Town", nameSi: "පුත්තලම නගරය", lat: 8.0362, lng: 79.8283 },
      { id: "chilaw", name: "Chilaw", nameSi: "හලාවත", lat: 7.5758, lng: 79.7953 },
      { id: "marawila", name: "Marawila", nameSi: "මාරවිල", lat: 7.4167, lng: 79.8167 },
      { id: "kalpitiya", name: "Kalpitiya", nameSi: "කල්පිටිය", lat: 8.2333, lng: 79.7333 },
    ],
  },
  LK12: {
    id: "LK12",
    name: "Gampaha",
    nameSi: "ගම්පහ",
    centroid: { lat: 7.0840, lng: 79.9925, cx: 323.9, cy: 678.1 },
    viewBox: "270 630 140 100",
    subLocations: [
      { id: "gampaha_town", name: "Gampaha Town", nameSi: "ගම්පහ නගරය", lat: 7.0840, lng: 79.9925 },
      { id: "negombo", name: "Negombo", nameSi: "මීගමුව", lat: 7.2083, lng: 79.8358 },
      { id: "katunayake", name: "Katunayake", nameSi: "කටුනායක", lat: 7.1706, lng: 79.8872 },
      { id: "kelaniya", name: "Kelaniya", nameSi: "කැලණිය", lat: 6.9553, lng: 79.9222 },
    ],
  },
  LK13: {
    id: "LK13",
    name: "Kalutara",
    nameSi: "කළුතර",
    centroid: { lat: 6.5854, lng: 79.9607, cx: 350.0, cy: 808.3 },
    viewBox: "290 760 160 130",
    subLocations: [
      { id: "kalutara_town", name: "Kalutara Town", nameSi: "කළුතර නගරය", lat: 6.5854, lng: 79.9607 },
      { id: "panadura", name: "Panadura", nameSi: "පානදුර", lat: 6.7131, lng: 79.9075 },
      { id: "horana", name: "Horana", nameSi: "හොරණ", lat: 6.7167, lng: 80.0667 },
      { id: "mathugama", name: "Mathugama", nameSi: "මතුගම", lat: 6.5222, lng: 80.1139 },
    ],
  },
  LK32: {
    id: "LK32",
    name: "Matara",
    nameSi: "මාතර",
    centroid: { lat: 5.9496, lng: 80.5469, cx: 447.2, cy: 912.1 },
    viewBox: "390 850 150 110",
    subLocations: [
      { id: "matara_town", name: "Matara Town", nameSi: "මාතර නගරය", lat: 5.9496, lng: 80.5469 },
      { id: "weligama", name: "Weligama", nameSi: "වැලිගම", lat: 5.9728, lng: 80.4286 },
      { id: "dondra", name: "Dondra", nameSi: "දෙවිනුවර", lat: 5.9250, lng: 80.5892 },
      { id: "deniyaya", name: "Deniyaya", nameSi: "දෙනියාය", lat: 6.3400, lng: 80.5586 },
    ],
  },
  LK72: {
    id: "LK72",
    name: "Polonnaruwa",
    nameSi: "පොළොන්නරුව",
    centroid: { lat: 7.9403, lng: 81.0188, cx: 564.1, cy: 472.4 },
    viewBox: "500 390 180 160",
    subLocations: [
      { id: "polonnaruwa_town", name: "Polonnaruwa Town", nameSi: "පොළොන්නරුව නගරය", lat: 7.9403, lng: 81.0188 },
      { id: "hingurakgoda", name: "Hingurakgoda", nameSi: "හිඟුරක්ගොඩ", lat: 8.0500, lng: 80.9833 },
      { id: "kaduruwela", name: "Kaduruwela", nameSi: "කඩුරුවෙල", lat: 7.9333, lng: 81.0167 },
      { id: "medirigiriya", name: "Medirigiriya", nameSi: "මැදිරිගිරිය", lat: 8.1500, lng: 80.9667 },
    ],
  },
  LK82: {
    id: "LK82",
    name: "Monaragala",
    nameSi: "මොණරාගල",
    centroid: { lat: 6.8728, lng: 81.3506, cx: 636.5, cy: 768.7 },
    viewBox: "550 700 190 200",
    subLocations: [
      { id: "monaragala_town", name: "Monaragala Town", nameSi: "මොණරාගල නගරය", lat: 6.8728, lng: 81.3506 },
      { id: "wellawaya", name: "Wellawaya", nameSi: "වැල්ලවාය", lat: 6.7386, lng: 81.1017 },
      { id: "kataragama", name: "Kataragama", nameSi: "කතරගම", lat: 6.4133, lng: 81.3325 },
      { id: "bibile", name: "Bibile", nameSi: "බිබිල", lat: 7.1667, lng: 81.2167 },
    ],
  },
  LK92: {
    id: "LK92",
    name: "Kegalle",
    nameSi: "කෑගල්ල",
    centroid: { lat: 7.2513, lng: 80.3464, cx: 397.2, cy: 688.2 },
    viewBox: "340 630 140 130",
    subLocations: [
      { id: "kegalle_town", name: "Kegalle Town", nameSi: "කෑගල්ල නගරය", lat: 7.2513, lng: 80.3464 },
      { id: "mawanella", name: "Mawanella", nameSi: "මාවනැල්ල", lat: 7.2528, lng: 80.4444 },
      { id: "rambukkana", name: "Rambukkana", nameSi: "රඹුක්කන", lat: 7.3333, lng: 80.3833 },
      { id: "ruwanwella", name: "Ruwanwella", nameSi: "රුවන්වැල්ල", lat: 7.0436, lng: 80.2522 },
    ],
  },
  LK22: {
    id: "LK22",
    name: "Matale",
    nameSi: "මාතලේ",
    centroid: { lat: 7.4675, lng: 80.6234, cx: 482.0, cy: 566.8 },
    viewBox: "430 510 150 140",
    subLocations: [
      { id: "matale_town", name: "Matale Town", nameSi: "මාතලේ නගරය", lat: 7.4675, lng: 80.6234 },
      { id: "dambulla", name: "Dambulla", nameSi: "දඹුල්ල", lat: 7.8600, lng: 80.6517 },
      { id: "sigiriya", name: "Sigiriya", nameSi: "සීගිරිය", lat: 7.9570, lng: 80.7603 },
      { id: "ukuwela", name: "Ukuwela", nameSi: "උකුවෙල", lat: 7.4167, lng: 80.6167 },
    ],
  },
};
