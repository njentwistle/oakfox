export interface Location {
  slug: string;
  name: string;
  region: string;
  postcode: string;
  distance: string;
  /** Town-centre coordinates — drives the Place geo in the location schema. */
  geo: { lat: number; lng: number };
  description: string;
  strengths: string[];
  sectors: string[];
  nearby: string[];
  /** Portfolio case studies from the sectors that lead this location's economy. */
  relatedWork?: { slug: string; title: string; note: string }[];
}

export const locations: Location[] = [
  {
    slug: 'ormskirk',
    name: 'Ormskirk',
    region: 'West Lancashire',
    postcode: 'L39',
    distance: '10 minutes south of the studio',
    geo: { lat: 53.5686, lng: -2.8869 },
    description:
      "Ormskirk is our closest town — a ten-minute drive from the studio. A market town with a strong independent retail scene along Burscough Street and Moor Street, a university population, a long Wednesday/Saturday market tradition, and a growing cluster of independent hospitality. We have worked with businesses in Ormskirk on brand identity, website design, and marketing since launching.",
    strengths: [
      'Walk-in reachable for on-site brand discovery and photography',
      'Strong independent retail and market economy',
      'University town — good photography and copywriting talent pool locally',
      'Active business improvement district with regular networking',
    ],
    sectors: [
      'Independent retail and hospitality',
      'Professional services',
      'Education and training',
      'Food and drink producers',
    ],
    nearby: ['Burscough', 'Aughton', 'Skelmersdale', 'Rufford', 'Southport'],
  },
  {
    slug: 'burscough',
    name: 'Burscough',
    region: 'West Lancashire',
    postcode: 'L40',
    distance: '0 minutes — our base',
    geo: { lat: 53.6041979, lng: -2.8431106 },
    description:
      "Burscough is where OakFox is based — Martland Mill sits on the edge of the village, a few minutes from Burscough Bridge and five from Ormskirk. A village that has grown carefully around the canal, with independent food producers, maker studios, and some of the best village hospitality in West Lancashire. Local clients and collaborators are common — studio visits take minutes.",
    strengths: [
      'Our studio — walk-in meetings, same-day turnaround where needed',
      'Active community of independent makers and producers',
      'Close canal-side location — good for product and lifestyle photography',
      'Five minutes from Ormskirk for additional talent and services',
    ],
    sectors: [
      'Food and drink producers',
      'Artisan makers and craft businesses',
      'Village hospitality',
      'Canal and outdoor recreation',
    ],
    nearby: ['Ormskirk', 'Parbold', 'Rufford', 'Mere Brow', 'Croston'],
  },
  {
    slug: 'southport',
    name: 'Southport',
    region: 'Merseyside / West Lancashire border',
    postcode: 'PR8 / PR9',
    distance: '25 minutes west of the studio',
    geo: { lat: 53.6458, lng: -3.0104 },
    description:
      "Southport is the closest coastal town — a twenty-five-minute drive from Burscough. A Victorian seaside resort reinventing itself around independent hospitality, cultural institutions, and an arts festival calendar. We work with hospitality venues, retailers, cultural organisations, and small producers along Lord Street and the broader Southport business community.",
    strengths: [
      'Day-trip reachable — quarterly reviews, shoots, and installations practical',
      'Strong cultural and events calendar — festivals, food events, markets',
      'Mature independent hospitality scene around Lord Street',
      'Good photography locations — promenade, pier, botanic gardens',
    ],
    sectors: [
      'Hospitality and restaurants',
      'Cultural and arts organisations',
      'Independent retail',
      'Leisure and tourism businesses',
    ],
    nearby: ['Birkdale', 'Ainsdale', 'Formby', 'Churchtown', 'Banks'],
    relatedWork: [
      {
        slug: 'roll',
        title: 'Roll — artisan bakery & coffee shop',
        note: 'A complete brand identity for an independent bakery: visual system, in-store experience, packaging, and sustainability consultancy. The same craft-hospitality branding that suits Lord Street.',
      },
      {
        slug: 'aigean',
        title: 'Aigéan — coastal seafood restaurant',
        note: 'Brand identity and environmental consultancy for a Michelin-quality seafood restaurant, launched alongside a Michelin-starred chef joining the kitchen. Coastal dining, branded properly.',
      },
    ],
  },
  {
    slug: 'preston',
    name: 'Preston',
    region: 'Central Lancashire',
    postcode: 'PR1 / PR2',
    distance: '35 minutes north of the studio',
    geo: { lat: 53.7632, lng: -2.7031 },
    description:
      "Preston is Lancashire's administrative city — a thirty-five-minute drive from Burscough. Home to the University of Central Lancashire, professional service firms, manufacturing businesses, a growing creative sector around the Guild Hall area, and Lancashire County Council. We work with Preston businesses on brand identity, website design, marketing, and sustainability consulting.",
    strengths: [
      'Reachable within an hour — on-site workshops and reviews practical',
      'Largest concentration of professional services in Lancashire',
      'University and creative sector talent pool',
      'Well-connected by rail — West Coast Main Line and regional links',
    ],
    sectors: [
      'Professional services — legal, accountancy, surveying',
      'Manufacturing and engineering',
      'Education and public sector',
      'Creative and cultural organisations',
    ],
    nearby: ['Fulwood', 'Penwortham', 'Leyland', 'Longridge', 'Chorley'],
  },
  {
    slug: 'manchester',
    name: 'Manchester',
    region: 'Greater Manchester',
    postcode: 'M1 / M2 / M4',
    distance: '45 minutes east of the studio',
    geo: { lat: 53.4808, lng: -2.2426 },
    description:
      "Manchester is the north-west's commercial and creative centre — a forty-five-minute drive from Burscough, or just over an hour by train. We work with Manchester clients across Ancoats, the Northern Quarter, Media City, and the wider city centre on brand identity, website design and build, copywriting, and marketing. For startup and scale-up clients, our static-first web development and design system work is a particularly good fit.",
    strengths: [
      'One of the UK\'s strongest creative and tech ecosystems outside London',
      'Mature scale-up and B2B software sector',
      'Strong independent hospitality and cultural scene',
      'Good rail and road connectivity from the studio — in-person meetings easy',
    ],
    sectors: [
      'B2B software and technology',
      'Creative and media businesses',
      'Independent hospitality and retail',
      'Professional services and consultancy',
    ],
    nearby: ['Salford', 'Stockport', 'Altrincham', 'Bolton', 'Wigan'],
  },
  {
    slug: 'lancashire',
    name: 'Lancashire',
    region: 'North West England',
    postcode: 'BB, FY, L, LA, PR',
    distance: 'Our county',
    geo: { lat: 53.8000, lng: -2.6000 },
    description:
      "Lancashire is our home county — from the Ribble Valley and Clitheroe in the north, the West Coast running through Southport and Blackpool, and the central corridor from Preston south to the West Lancashire plain. We work with independent businesses, established brands, regenerative farmers, and ecological consultancies across the county. Environmental consultancy and automation work is particularly active in the rural Lancashire hinterland.",
    strengths: [
      'Deep regional knowledge — suppliers, producers, talent, and tradespeople',
      'Active regenerative farming and environmental sector',
      'Strong independent hospitality scene (Ribble Valley, West Lancashire, Lake District fringe)',
      'Heritage food and drink producers across the county',
    ],
    sectors: [
      'Hospitality and food and drink',
      'Agriculture and regenerative farming',
      'Environmental consultancies and ecologists',
      'Independent retail and craft businesses',
      'Heritage and cultural tourism',
    ],
    nearby: ['Ormskirk', 'Preston', 'Southport', 'Clitheroe', 'Lancaster', 'Blackburn', 'Burnley'],
  },
];
