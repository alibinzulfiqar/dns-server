const recordTypes = [
  { value: 'A', label: 'A (IPv4 Address)', description: 'Maps a domain to an IPv4 address' },
  { value: 'AAAA', label: 'AAAA (IPv6 Address)', description: 'Maps a domain to an IPv6 address' },
  { value: 'CNAME', label: 'CNAME (Canonical Name)', description: 'Alias for another domain name' },
  { value: 'MX', label: 'MX (Mail Exchange)', description: 'Specifies mail servers for the domain' },
  { value: 'TXT', label: 'TXT (Text Record)', description: 'Holds arbitrary text data' },
  { value: 'NS', label: 'NS (Name Server)', description: 'Specifies authoritative name servers' },
  { value: 'SRV', label: 'SRV (Service)', description: 'Specifies location of services' },
  { value: 'PTR', label: 'PTR (Pointer)', description: 'Maps an IP address to a domain name' },
  { value: 'CAA', label: 'CAA (Certificate Authority)', description: 'Specifies which CAs can issue certificates' },
];

const typeColors = {
  A: 'bg-blue-100 text-blue-800',
  AAAA: 'bg-purple-100 text-purple-800',
  CNAME: 'bg-green-100 text-green-800',
  MX: 'bg-orange-100 text-orange-800',
  TXT: 'bg-gray-100 text-gray-800',
  NS: 'bg-cyan-100 text-cyan-800',
  SRV: 'bg-pink-100 text-pink-800',
  PTR: 'bg-yellow-100 text-yellow-800',
  CAA: 'bg-red-100 text-red-800',
  SOA: 'bg-indigo-100 text-indigo-800',
};

export function RecordTypeBadge({ type }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[type] || 'bg-gray-100 text-gray-800'}`}>
      {type}
    </span>
  );
}

export function RecordTypeSelect({ value, onChange, className = '' }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`input ${className}`}
    >
      <option value="">Select type...</option>
      {recordTypes.map((type) => (
        <option key={type.value} value={type.value}>
          {type.label}
        </option>
      ))}
    </select>
  );
}

export function getRecordTypeInfo(type) {
  return recordTypes.find((t) => t.value === type) || { value: type, label: type, description: '' };
}

export { recordTypes };
