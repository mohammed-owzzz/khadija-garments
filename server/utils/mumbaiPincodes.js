// Complete list of Mumbai (Mumbai City + Mumbai Suburban district) pincodes.
// Orders delivering to any of these get FREE shipping; every other pincode is
// charged the standard shipping fee (transportation cost is absorbed into it).
export const SHIPPING_FEE = 99

const MUMBAI_PINCODES = new Set([
  '400001', '400002', '400003', '400004', '400005', '400006', '400007', '400008', '400009', '400010',
  '400011', '400012', '400013', '400014', '400015', '400016', '400017', '400018', '400019', '400020',
  '400021', '400022', '400023', '400024', '400025', '400026', '400027', '400028', '400029', '400030',
  '400031', '400032', '400033', '400034', '400035', '400036', '400037', '400038', '400039', '400042',
  '400043', '400049', '400050', '400051', '400052', '400053', '400054', '400055', '400056', '400057',
  '400058', '400059', '400060', '400061', '400062', '400063', '400064', '400065', '400066', '400067',
  '400068', '400069', '400070', '400071', '400072', '400074', '400075', '400076', '400077', '400078',
  '400079', '400080', '400081', '400082', '400083', '400084', '400085', '400086', '400087', '400088',
  '400089', '400090', '400091', '400092', '400093', '400094', '400095', '400096', '400097', '400098',
  '400099', '400101', '400102', '400103', '400104',
])

// Returns true when the given pincode belongs to Mumbai (free delivery zone).
export function isMumbaiPincode(pincode) {
  if (!pincode) return false
  return MUMBAI_PINCODES.has(String(pincode).trim())
}

export default isMumbaiPincode