// Industry data structure
export interface Activity {
  name: string
  id: string
}

export interface SubIndustry {
  name: string
  id: string
  activities?: Activity[]
}

export interface Industry {
  name: string
  id: string
  subIndustries: SubIndustry[]
}

export interface IndustryGroup {
  name: string
  id: string
  industries: Industry[]
}

export interface Sector {
  name: string
  id: string
  industryGroups: IndustryGroup[]
}

export interface IndustryData {
  sectors: Sector[]
}

// Function to fetch industry data
export interface IndustryGroup {
  name: string;
  id: string;
  industries: Industry[];
  description?: string;
}

export interface Sector {
  name: string;
  id: string;
  industryGroups: IndustryGroup[];
}

export async function getIndustryData(): Promise<IndustryData> {
  return {
    sectors: [
      {
        name: "Technology & Software",
        id: "technology-software",
        industryGroups: [
          { name: "Enterprise Software", id: "enterprise-software", description: "ERP, CRM, HCM, SCM, business intelligence, workflow automation, project management platforms, etc.", industries: [] },
          { name: "Infrastructure Software", id: "infrastructure-software", description: "Operating systems, databases, middleware, security software, cloud platforms, DevOps tools, etc.", industries: [] },
          { name: "Consumer Software", id: "consumer-software", description: "Mobile apps, gaming, social media, entertainment software, personal productivity apps, etc.", industries: [] },
          { name: "Hardware & Semiconductors", id: "hardware-semiconductors", description: "Computer hardware, networking equipment, chips, electronic components, IT hardware refurbishment, etc.", industries: [] },
          { name: "Telecommunications", id: "telecommunications", description: "Telecom services, equipment, wireless infrastructure, satellite communications, carrier services, etc.", industries: [] },
          { name: "Emerging Technologies", id: "emerging-technologies", description: "AI/ML, blockchain, IoT, robotics, quantum computing, AR/VR, digital transformation services, etc.", industries: [] },
        ],
      },
      {
        name: "Healthcare & Life Sciences",
        id: "healthcare-life-sciences",
        industryGroups: [
          { name: "Pharmaceuticals", id: "pharmaceuticals", description: "Drug development, generic drugs, specialty pharmaceuticals, vaccines, CDMO/contract manufacturing, ANDA portfolios, etc.", industries: [] },
          { name: "Medical Devices", id: "medical-devices", description: "Diagnostic equipment, surgical instruments, implantable devices, wearables, etc.", industries: [] },
          { name: "Healthcare Services", id: "healthcare-services", description: "Hospitals, clinics, telemedicine, home healthcare, urgent care, surgical centers, pain management, behavioral health, etc.", industries: [] },
          { name: "Biotechnology", id: "biotechnology", description: "Gene therapy, cell therapy, molecular diagnostics, research tools, etc.", industries: [] },
          { name: "Healthcare IT", id: "healthcare-it", description: "Electronic health records, healthcare analytics, digital health platforms, etc.", industries: [] },
          { name: "Medical Supplies", id: "medical-supplies", description: "Consumables, personal protective equipment, laboratory supplies, etc.", industries: [] },
        ],
      },
      {
        name: "Financial Services",
        id: "financial-services",
        industryGroups: [
          { name: "Banking", id: "banking", description: "Commercial banks, investment banks, regional banks, credit unions, etc.", industries: [] },
          { name: "Insurance", id: "insurance", description: "Life, property & casualty, health, reinsurance, insurance technology, insurance marketing organizations (IMOs), etc.", industries: [] },
          { name: "Asset Management", id: "asset-management", description: "Mutual funds, hedge funds, private equity, wealth management, etc.", industries: [] },
          { name: "Financial Technology", id: "financial-technology", description: "Payment processing, lending platforms, digital banking, payment orchestration, blockchain finance, etc.", industries: [] },
          { name: "Real Estate Finance", id: "real-estate-finance", description: "REITs, mortgage companies, real estate investment, property management finance, etc.", industries: [] },
          { name: "Specialty Finance", id: "specialty-finance", description: "Equipment financing, factoring, merchant cash advances, consumer credit, specialty lending, etc.", industries: [] },
        ],
      },
      {
        name: "Industrial & Manufacturing",
        id: "industrial-manufacturing",
        industryGroups: [
          { name: "Aerospace & Defense", id: "aerospace-defense", description: "Aircraft manufacturing, defense contractors, space technology, military equipment, aerospace supply chain, etc. For lift equipment and cranes, use Heavy Machinery.", industries: [] },
          { name: "Automotive", id: "automotive", description: "Vehicle manufacturing, auto parts, electric vehicles, autonomous driving technology, fleet vehicles, truck hire/rental, etc.", industries: [] },
          { name: "Heavy Machinery", id: "heavy-machinery", description: "Construction equipment, agricultural machinery, mining equipment, industrial tools, lift equipment, cranes, material handling equipment, etc.", industries: [] },
          { name: "Materials, Chemicals & Mining", id: "materials-chemicals-mining", description: "Specialty chemicals, commodities, plastics, metals, building materials, mining operations, resource extraction, ethanol production, metalworking, etc.", industries: [] },
          { name: "Energy Equipment", id: "energy-equipment", description: "Oil & gas equipment, renewable energy hardware, power generation equipment, oilfield machining & tool making, etc.", industries: [] },
          { name: "Industrial Services", id: "industrial-services", description: "Contract manufacturing, equipment rental, maintenance services, industrial automation, rope access & specialty access services, etc. For HVAC, plumbing, electrical, roofing, use Specialty Trade Contractors under Real Estate & Construction.", industries: [] },
          { name: "Building Products Manufacturing", id: "building-products-manufacturing", description: "Windows, doors, patio doors, architectural & landscape lighting, flooring products, roofing materials, signage & graphics manufacturing, display manufacturing, etc.", industries: [] },
        ],
      },
      {
        name: "Consumer & Retail",
        id: "consumer-retail",
        industryGroups: [
          { name: "Retail", id: "retail", description: "Department stores, specialty retail, e-commerce, grocery, discount retail, travel centers, convenience stores, Shopify/DTC commerce, etc.", industries: [] },
          { name: "Consumer Brands", id: "consumer-brands", description: "Apparel, footwear, accessories, home goods, personal care products, outdoor/recreation products, oral care, giftware, firearms & sporting goods, etc.", industries: [] },
          { name: "Food & Beverage", id: "food-beverage", description: "Food processing, restaurants, QSR/franchise restaurants, beverages, non-alcoholic beverages, meat processing & distribution, agricultural products, food technology, water filtration, etc.", industries: [] },
          { name: "Media & Entertainment", id: "media-entertainment", description: "Streaming services, content production, gaming, sports, publishing, B2B publishing, etc.", industries: [] },
          { name: "Hospitality & Travel", id: "hospitality-travel", description: "Hotels, airlines, travel agencies, cruise lines, entertainment venues, online travel agencies (OTAs), golf courses, leisure destinations, etc.", industries: [] },
          { name: "Consumer Services", id: "consumer-services", description: "Education services, fitness, beauty services, home services, curtains/blinds/upholstery, soft furnishings, etc.", industries: [] },
          { name: "Wholesale & Distribution", id: "wholesale-distribution", description: "Product distributors, wholesale suppliers, promotional merchandise, trade-exclusive supply, import/export distribution, food & beverage distribution. For trucking and freight, use Transportation & Logistics.", industries: [] },
        ],
      },
      {
        name: "Energy & Utilities",
        id: "energy-utilities",
        industryGroups: [
          { name: "Oil & Gas", id: "oil-gas", description: "Upstream exploration, midstream transport, downstream refining, oilfield services, etc.", industries: [] },
          { name: "Renewable Energy", id: "renewable-energy", description: "Solar, wind, hydroelectric, energy storage, green hydrogen, etc.", industries: [] },
          { name: "Electric Utilities", id: "electric-utilities", description: "Power generation, transmission, distribution, grid modernization, etc.", industries: [] },
          { name: "Energy Trading", id: "energy-trading", description: "Commodity trading, energy markets, risk management, energy finance, etc.", industries: [] },
          { name: "Water & Waste", id: "water-waste", description: "Water utilities, waste management, environmental services, recycling, etc.", industries: [] },
          { name: "Energy Technology", id: "energy-technology", description: "Smart grid, energy efficiency, carbon capture, energy management software, etc.", industries: [] },
        ],
      },
      {
        name: "Real Estate & Construction",
        id: "real-estate-construction",
        industryGroups: [
          { name: "Commercial Real Estate", id: "commercial-real-estate", description: "Office buildings, retail properties, industrial facilities, data centers, etc. Golf courses and leisure venues belong under Hospitality & Travel.", industries: [] },
          { name: "Residential Real Estate", id: "residential-real-estate", description: "Home building, residential development, property management, senior housing, lifestyle-focused homebuilders, etc.", industries: [] },
          { name: "Construction", id: "construction", description: "General contracting (commercial & public sector), mission-critical construction, design-build firms. For specialty trades (HVAC, plumbing, etc.), use Specialty Trade Contractors. For underground utilities, use Civil Engineering & Site Work.", industries: [] },
          { name: "Specialty Trade Contractors", id: "specialty-trade-contractors", description: "HVAC, plumbing, electrical, roofing, concrete & masonry, demolition, MEP, flooring installation, painting, fire protection installation, residential & commercial trade services.", industries: [] },
          { name: "Civil Engineering & Site Work", id: "civil-engineering-site-work", description: "Underground utilities, site development, earthwork, land clearing, grading, paving, civil infrastructure, civil repair & maintenance, environmental remediation site work.", industries: [] },
          { name: "Real Estate Services", id: "real-estate-services", description: "Brokerage, appraisal, property management, real estate technology, etc.", industries: [] },
          { name: "Infrastructure", id: "infrastructure", description: "Transportation infrastructure, public works, environmental infrastructure, etc.", industries: [] },
          { name: "REITs & Real Estate Investment", id: "reits-real-estate-investment", description: "Public REITs, private real estate funds, real estate crowdfunding, etc.", industries: [] },
        ],
      },
      {
        name: "Transportation & Logistics",
        id: "transportation-logistics",
        industryGroups: [
          { name: "Shipping, Freight & Distribution", id: "shipping-freight-distribution", description: "Ocean shipping, trucking, rail transport, air cargo, freight brokerage, tractor/driver outsourcing, 3PL services. For product wholesalers, use Wholesale & Distribution under Consumer & Retail.", industries: [] },
          { name: "Logistics Services", id: "logistics-services", description: "Third-party logistics, warehousing, distribution centers, supply chain management, etc.", industries: [] },
          { name: "Transportation Technology", id: "transportation-technology", description: "Fleet management, route optimization, autonomous vehicles, logistics software, etc.", industries: [] },
          { name: "Public Transportation", id: "public-transportation", description: "Airlines, mass transit, ride sharing, mobility services, vehicle rental for ride-sharing operators, etc.", industries: [] },
          { name: "Maritime & Ports", id: "maritime-ports", description: "Port operations, marine services, shipbuilding, offshore services, etc.", industries: [] },
          { name: "Last-Mile Delivery", id: "last-mile-delivery", description: "Package delivery, food delivery, local logistics, final-mile logistics, drone delivery, etc.", industries: [] },
        ],
      },
      {
        name: "Professional Services",
        id: "professional-services",
        industryGroups: [
          { name: "Consulting", id: "consulting", description: "Management consulting, IT consulting, strategy consulting, operations consulting, SPAC advisory, public-market readiness, etc.", industries: [] },
          { name: "Legal & Regulatory", id: "legal-regulatory", description: "Law firms, legal technology, compliance services, regulatory consulting, etc.", industries: [] },
          { name: "Accounting & Tax", id: "accounting-tax", description: "Accounting firms, tax services, audit services, financial advisory, etc.", industries: [] },
          { name: "Marketing & Advertising", id: "marketing-advertising", description: "Digital marketing agencies, advertising agencies, public relations, market research, experiential marketing, trade show services, SaaS survey platforms, etc.", industries: [] },
          { name: "Human Resources", id: "human-resources", description: "HR technology, workforce management, benefits administration, human capital consulting, organizational culture consulting, etc. For staffing agencies and recruiting firms, use Staffing & Recruiting.", industries: [] },
          { name: "Staffing & Recruiting", id: "staffing-recruiting", description: "Light industrial staffing, warehouse staffing, specialist labour recruitment, executive recruiting, temp staffing agencies, staffing for specific verticals (healthcare, IT, trades, etc.).", industries: [] },
          { name: "Business Process Outsourcing", id: "business-process-outsourcing", description: "Call centers, data processing, document management, shared services, CX/customer experience outsourcing, etc.", industries: [] },
        ],
      },
      {
        name: "Government & Non-Profit",
        id: "government-non-profit",
        industryGroups: [
          { name: "Government Services", id: "government-services", description: "Federal contractors, state and local services, public sector technology, etc.", industries: [] },
          { name: "Defense & Security", id: "defense-security", description: "Cybersecurity, physical security, surveillance, emergency services, alarm monitoring, AV/security installation, life safety systems, fire protection services. Covers both government and commercial security services.", industries: [] },
          { name: "Education", id: "education", description: "K-12 education, higher education, educational technology, vocational training, rope access & safety training, etc.", industries: [] },
          { name: "Healthcare & Social Services", id: "healthcare-social-services", description: "Public health, social services, non-profit healthcare, community services, etc.", industries: [] },
          { name: "Environmental & Regulatory", id: "environmental-regulatory", description: "Environmental consulting, regulatory compliance, public policy, etc.", industries: [] },
          { name: "International & Trade", id: "international-trade", description: "Export/import services, international development, trade finance, etc.", industries: [] },
        ],
      },
    ],
  };
}
