// Local NLP classifier mapping description keywords to departments (electricity, water, roads, cleaning)

const keywords = {
  electricity: ['light', 'bijli', 'power', 'wire', 'transformer', 'electricity', 'meter', 'current', 'spark', 'blackout', 'shading', 'pole', 'खंभा', 'बिजली', 'तार'],
  water: ['water', 'pani', 'leakage', 'tap', 'well', 'tanker', 'pipeline', 'dirty', 'borewell', 'पानी', 'नजला', 'नल', 'कुआं', 'टैंकर'],
  roads: ['road', 'sadak', 'pothole', 'street', 'highway', 'gaddha', 'bridge', 'pavement', 'सड़क', 'गड्ढा', 'रास्ता'],
  cleaning: ['garbage', 'kachra', 'drainage', 'cleaning', 'waste', 'dump', 'smell', 'mosquito', 'safai', 'litter', 'dustbin', 'sweep', 'गंदगी', 'कचरा', 'सफाई', 'नाली']
};

function classifyComplaint(description) {
  if (!description) return null;
  
  const text = description.toLowerCase();
  let maxScore = 0;
  let bestDept = null;

  for (const [dept, list] of Object.entries(keywords)) {
    let score = 0;
    for (const word of list) {
      if (text.includes(word)) {
        score += 1;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestDept = dept;
    }
  }

  return bestDept;
}

module.exports = { classifyComplaint };
