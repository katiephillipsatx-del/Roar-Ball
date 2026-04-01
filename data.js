const TEAMS = [
  { name: 'Vineland Thorns', abbr: 'THO', location: 'Vineland', color: 0x1A7A1A, stadium: 'Thorn Garden Arena', players: [
    { name: 'Jett Fillmore', type: 'Panther', ht: "9'1\"", spd: 10, sht: 10, drb: 9, def: 6, str: 5, num: 3 },
    { name: 'Lenny Williamson', type: 'Giraffe', ht: "17'5\"", spd: 8, sht: 5, drb: 5, def: 5, str: 5, num: 7 },
    { name: 'Olivia Burke', type: 'Ostrich', ht: "8'8\"", spd: 10, sht: 8, drb: 7, def: 6, str: 4, num: 22 },
    { name: 'Modo Olachenko', type: 'Komodo', ht: "11'10\"", spd: 10, sht: 7, drb: 8, def: 8, str: 7, num: 11 },
    { name: 'Archie Everhardt', type: 'Rhino', ht: "9'6\"", spd: 10, sht: 6, drb: 6, def: 9, str: 10, num: 34 },
    { name: 'Will Harris', type: 'Goat', ht: "5'7\"", spd: 10, sht: 10, drb: 9, def: 6, str: 5, num: 0 }
  ]},
  { name: 'Team Magma', abbr: 'MAG', location: 'Inferno Lava Coast', color: 0xCC2200, stadium: 'The Inferno', players: [
    { name: 'Mane Attraction', type: 'Horse', ht: "10'0\"", spd: 10, sht: 8, drb: 8, def: 7, str: 8, num: 12 },
    { name: 'Grizz', type: 'Bear', ht: "10'0\"", spd: 10, sht: 6, drb: 6, def: 9, str: 10, num: 32 },
    { name: 'Kong', type: 'Gorilla', ht: "9'0\"", spd: 10, sht: 5, drb: 7, def: 8, str: 10, num: 88 },
    { name: 'Lary', type: 'Lizard', ht: "10'0\"", spd: 10, sht: 7, drb: 7, def: 8, str: 6, num: 88 },
    { name: 'Bill', type: 'Bull', ht: "9'9\"", spd: 10, sht: 6, drb: 6, def: 8, str: 9, num: 88 },
    { name: 'Cinder', type: 'Salamander', ht: "9'5\"", spd: 10, sht: 8, drb: 8, def: 7, str: 6, num: 88 }
  ]},
  { name: 'Team Shadows', abbr: 'SHA', location: 'Sunken City', color: 0x2E0A50, stadium: 'The Cave', players: [
    { name: 'Kouyate', type: 'Alligator', ht: "8'9\"", spd: 10, sht: 7, drb: 7, def: 8, str: 8, num: 1 },
    { name: 'Rosette', type: 'PurpleBull', ht: "9'0\"", spd: 10, sht: 6, drb: 6, def: 8, str: 8, num: 33 },
    { name: 'Daskas', type: 'Gorilla', ht: "9'0\"", spd: 10, sht: 5, drb: 6, def: 8, str: 9, num: 34 },
    { name: 'Chase', type: 'Lion', ht: "8'11\"", spd: 10, sht: 8, drb: 8, def: 7, str: 7, num: 5 },
    { name: 'Ripper', type: 'Jaguar', ht: "9'9\"", spd: 10, sht: 8, drb: 9, def: 7, str: 6, num: 7 },
    { name: 'Viper', type: 'BlackMamba', ht: "10'0\"", spd: 10, sht: 9, drb: 9, def: 8, str: 5, num: 10 }
  ]},
  { name: 'Team Shivers', abbr: 'SHI', location: 'Arctic', color: 0x00Aaff, stadium: 'The Cryosphere', players: [
    { name: 'Propp', type: 'PolarBear', ht: "10'0\"", spd: 10, sht: 6, drb: 6, def: 9, str: 10, num: 50 },
    { name: 'Spots', type: 'SnowLeopard', ht: "8'10\"", spd: 10, sht: 8, drb: 9, def: 7, str: 5, num: 13 },
    { name: 'Fang', type: 'Sabertooth', ht: "9'4\"", spd: 10, sht: 7, drb: 8, def: 8, str: 7, num: 22 },
    { name: 'Moe', type: 'Moose', ht: "11'2\"", spd: 10, sht: 5, drb: 5, def: 8, str: 9, num: 44 },
    { name: 'Blizzard', type: 'ArcticWolf', ht: "8'11\"", spd: 10, sht: 8, drb: 8, def: 7, str: 6, num: 9 },
    { name: 'Tusk', type: 'Walrus', ht: "9'8\"", spd: 10, sht: 4, drb: 4, def: 9, str: 10, num: 99 }
  ]},
  { name: 'The Sandstorms', abbr: 'SAN', location: 'Scorch Valley', color: 0xD2B48C, stadium: 'Scorch Valley Arena', players: [
    { name: 'Dune', type: 'Camel', ht: "10'5\"", spd: 10, sht: 6, drb: 6, def: 8, str: 8, num: 2 },
    { name: 'Sting', type: 'Scorpion', ht: "8'5\"", spd: 10, sht: 8, drb: 9, def: 7, str: 5, num: 8 },
    { name: 'Sandy', type: 'FennecFox', ht: "7'6\"", spd: 10, sht: 9, drb: 9, def: 6, str: 4, num: 1 },
    { name: 'Rattles', type: 'Sidewinder', ht: "9'2\"", spd: 10, sht: 7, drb: 8, def: 7, str: 5, num: 11 },
    { name: 'Cleo', type: 'SandCat', ht: "7'9\"", spd: 10, sht: 8, drb: 8, def: 6, str: 4, num: 5 },
    { name: 'Sly', type: 'Meerkat', ht: "7'2\"", spd: 10, sht: 8, drb: 9, def: 7, str: 3, num: 33 }
  ]}
];

// Helper to parse height strings like "9'1\"" to inches
function parseHeight(htStr) {
  let parts = htStr.split("'");
  let ft = parseInt(parts[0]);
  let inc = parseInt(parts[1].replace('"', ''));
  return (ft * 12) + inc;
}
