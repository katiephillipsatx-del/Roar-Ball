const TEAMS = [
  { name: 'Vineland Thorns', abbr: 'THO', location: 'Vineland', color: 0x1A7A1A, altColor: 0x0d4a0d, stadium: 'Thorn Garden Arena', players: [
    { name: 'Jett Fillmore',    type: 'Panther',    ht: "9'1\"",  spd: 10, sht: 10, drb: 9, def: 6, str: 5, num: 3,  ovr: 99, pos: 'SG', skinColor: 0x1a1a1a, animalColor: 0x111111 },
    { name: 'Lenny Williamson', type: 'Giraffe',    ht: "17'5\"", spd: 8,  sht: 5,  drb: 5, def: 5, str: 5, num: 7,  ovr: 82, pos: 'C',  skinColor: 0xcc8833, animalColor: 0xdd9944 },
    { name: 'Olivia Burke',     type: 'Ostrich',    ht: "8'8\"",  spd: 10, sht: 8,  drb: 7, def: 6, str: 4, num: 22, ovr: 88, pos: 'SF', skinColor: 0xeeeecc, animalColor: 0xddddbb },
    { name: 'Modo Olachenko',   type: 'Komodo',     ht: "11'10\"",spd: 10, sht: 7,  drb: 8, def: 8, str: 7, num: 11, ovr: 91, pos: 'PF', skinColor: 0x556b2f, animalColor: 0x4a7a35 },
    { name: 'Archie Everhardt', type: 'Rhino',      ht: "9'6\"",  spd: 10, sht: 6,  drb: 6, def: 9, str: 10, num: 34, ovr: 90, pos: 'C', skinColor: 0x888888, animalColor: 0x777777 },
    { name: 'Will Harris',      type: 'Goat',       ht: "5'7\"",  spd: 10, sht: 10, drb: 9, def: 6, str: 5, num: 0,  ovr: 85, pos: 'PG', skinColor: 0xf0d090, animalColor: 0xe8e8e0, noDunk: true }
  ]},
  { name: 'Team Magma', abbr: 'MAG', location: 'Inferno Lava Coast', color: 0xCC2200, altColor: 0x881500, stadium: 'The Inferno', players: [
    { name: 'Mane Attraction', type: 'Horse',      ht: "10'0\"", spd: 10, sht: 8,  drb: 8, def: 7, str: 8,  num: 12, ovr: 93, pos: 'SF', skinColor: 0xbb7733, animalColor: 0xaa6622 },
    { name: 'Grizz',           type: 'Bear',       ht: "10'0\"", spd: 10, sht: 6,  drb: 6, def: 9, str: 10, num: 32, ovr: 89, pos: 'C',  skinColor: 0x6b3a1f, animalColor: 0x7a4422 },
    { name: 'Kong',            type: 'Gorilla',    ht: "9'0\"",  spd: 10, sht: 5,  drb: 7, def: 8, str: 10, num: 88, ovr: 87, pos: 'PF', skinColor: 0x333333, animalColor: 0x222222 },
    { name: 'Lary',            type: 'Lizard',     ht: "10'0\"", spd: 10, sht: 7,  drb: 7, def: 8, str: 6,  num: 4,  ovr: 84, pos: 'PG', skinColor: 0x228833, animalColor: 0x336644 },
    { name: 'Bill',            type: 'Bull',       ht: "9'9\"",  spd: 10, sht: 6,  drb: 6, def: 8, str: 9,  num: 55, ovr: 86, pos: 'PF', skinColor: 0x4a3020, animalColor: 0x3a2010 },
    { name: 'Cinder',          type: 'Salamander', ht: "9'5\"",  spd: 10, sht: 8,  drb: 8, def: 7, str: 6,  num: 9,  ovr: 85, pos: 'SG', skinColor: 0xee4411, animalColor: 0xff5522 }
  ]},
  { name: 'Team Shadows', abbr: 'SHA', location: 'Sunken City', color: 0x6600cc, altColor: 0x2E0A50, stadium: 'The Cave', players: [
    { name: 'Kouyate', type: 'Alligator', ht: "8'9\"",  spd: 10, sht: 7,  drb: 7, def: 8, str: 8, num: 1,  ovr: 88, pos: 'PF', skinColor: 0x336633, animalColor: 0x446644 },
    { name: 'Rosette', type: 'Bull',      ht: "9'0\"",  spd: 10, sht: 6,  drb: 6, def: 8, str: 8, num: 33, ovr: 85, pos: 'C',  skinColor: 0x662244, animalColor: 0x773355 },
    { name: 'Daskas',  type: 'Gorilla',   ht: "9'0\"",  spd: 10, sht: 5,  drb: 6, def: 8, str: 9, num: 34, ovr: 83, pos: 'C',  skinColor: 0x222244, animalColor: 0x333355 },
    { name: 'Chase',   type: 'Lion',      ht: "8'11\"", spd: 10, sht: 8,  drb: 8, def: 7, str: 7, num: 5,  ovr: 91, pos: 'SF', skinColor: 0xcc9944, animalColor: 0xddaa55 },
    { name: 'Ripper',  type: 'Jaguar',    ht: "9'9\"",  spd: 10, sht: 8,  drb: 9, def: 7, str: 6, num: 7,  ovr: 92, pos: 'SG', skinColor: 0xddbb55, animalColor: 0xeecc66 },
    { name: 'Viper',   type: 'BlackMamba',ht: "10'0\"", spd: 10, sht: 9,  drb: 9, def: 8, str: 5, num: 10, ovr: 96, pos: 'SG', skinColor: 0x1a1a2a, animalColor: 0x111122 }
  ]},
  { name: 'Team Shivers', abbr: 'SHI', location: 'Arctic', color: 0x0088dd, altColor: 0x005599, stadium: 'The Cryosphere', players: [
    { name: 'Propp',    type: 'PolarBear',   ht: "10'0\"", spd: 10, sht: 6,  drb: 6, def: 9,  str: 10, num: 50, ovr: 88, pos: 'C',  skinColor: 0xeeeeff, animalColor: 0xffffff },
    { name: 'Spots',    type: 'SnowLeopard', ht: "8'10\"", spd: 10, sht: 8,  drb: 9, def: 7,  str: 5,  num: 13, ovr: 90, pos: 'SF', skinColor: 0xddddcc, animalColor: 0xeeeecc },
    { name: 'Fang',     type: 'Sabertooth',  ht: "9'4\"",  spd: 10, sht: 7,  drb: 8, def: 8,  str: 7,  num: 22, ovr: 87, pos: 'PF', skinColor: 0xcc9966, animalColor: 0xddaa77 },
    { name: 'Moe',      type: 'Moose',       ht: "11'2\"", spd: 10, sht: 5,  drb: 5, def: 8,  str: 9,  num: 44, ovr: 83, pos: 'C',  skinColor: 0x885533, animalColor: 0x996644 },
    { name: 'Blizzard', type: 'ArcticWolf',  ht: "8'11\"", spd: 10, sht: 8,  drb: 8, def: 7,  str: 6,  num: 9,  ovr: 89, pos: 'PG', skinColor: 0xccccee, animalColor: 0xddddff },
    { name: 'Tusk',     type: 'Walrus',      ht: "9'8\"",  spd: 10, sht: 4,  drb: 4, def: 9,  str: 10, num: 99, ovr: 81, pos: 'C',  skinColor: 0x886655, animalColor: 0x997766 }
  ]},
  { name: 'The Sandstorms', abbr: 'SAN', location: 'Scorch Valley', color: 0xcc8800, altColor: 0x8a5a00, stadium: 'Scorch Valley Arena', players: [
    { name: 'Dune',    type: 'Camel',    ht: "10'5\"", spd: 10, sht: 6,  drb: 6, def: 8, str: 8, num: 2,  ovr: 84, pos: 'PF', skinColor: 0xcc9944, animalColor: 0xddaa55 },
    { name: 'Sting',   type: 'Scorpion', ht: "8'5\"",  spd: 10, sht: 8,  drb: 9, def: 7, str: 5, num: 8,  ovr: 87, pos: 'SG', skinColor: 0x554422, animalColor: 0x443311 },
    { name: 'Sandy',   type: 'FennecFox',ht: "7'6\"",  spd: 10, sht: 9,  drb: 9, def: 6, str: 4, num: 1,  ovr: 91, pos: 'PG', skinColor: 0xeebb77, animalColor: 0xffcc88 },
    { name: 'Rattles', type: 'Sidewinder',ht: "9'2\"", spd: 10, sht: 7,  drb: 8, def: 7, str: 5, num: 11, ovr: 83, pos: 'SG', skinColor: 0xaa8844, animalColor: 0xbb9955 },
    { name: 'Cleo',    type: 'SandCat',  ht: "7'9\"",  spd: 10, sht: 8,  drb: 8, def: 6, str: 4, num: 5,  ovr: 85, pos: 'SF', skinColor: 0xddcc99, animalColor: 0xeeddaa },
    { name: 'Sly',     type: 'Meerkat',  ht: "7'2\"",  spd: 10, sht: 8,  drb: 9, def: 7, str: 3, num: 33, ovr: 82, pos: 'PG', skinColor: 0xbb9966, animalColor: 0xccaa77 }
  ]}
];

function parseHeight(htStr) {
  let parts = htStr.split("'");
  let ft = parseInt(parts[0]);
  let inc = parseInt(parts[1].replace('"', ''));
  return (ft * 12) + inc;
}
