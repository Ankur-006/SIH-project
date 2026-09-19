/**
 * IP Intelligence Module
 * Performs IP geolocation, VPN/proxy detection, and cloud provider identification.
 */

/**
 * Look up IP geolocation via ip-api.com
 */
export async function lookupIP(ip) {
  // Try multiple HTTPS geolocation APIs with fallback
  const apis = [
    {
      url: `https://ipwho.is/${ip}`,
      parse: (data) => {
        if (!data.success && data.success !== undefined) return null;
        return {
          ip: data.ip || ip,
          country: data.country || 'Unknown',
          countryCode: data.country_code || 'XX',
          region: data.region || 'Unknown',
          city: data.city || 'Unknown',
          lat: data.latitude,
          lon: data.longitude,
          timezone: data.timezone?.id || '',
          isp: data.connection?.isp || 'Unknown',
          org: data.connection?.org || data.connection?.isp || 'Unknown',
          as: data.connection?.asn ? `AS${data.connection.asn}` : '',
          asName: data.connection?.org || '',
          reverse: '',
          isMobile: false,
          isProxy: data.security?.proxy || false,
          isHosting: data.type === 'hosting' || false,
        };
      }
    },
    {
      url: `https://ipapi.co/${ip}/json/`,
      parse: (data) => {
        if (data.error) return null;
        return {
          ip: data.ip || ip,
          country: data.country_name || 'Unknown',
          countryCode: data.country_code || 'XX',
          region: data.region || 'Unknown',
          city: data.city || 'Unknown',
          lat: data.latitude,
          lon: data.longitude,
          timezone: data.timezone || '',
          isp: data.org || 'Unknown',
          org: data.org || 'Unknown',
          as: data.asn || '',
          asName: data.org || '',
          reverse: '',
          isMobile: false,
          isProxy: false,
          isHosting: data.org ? /host|cloud|server|datacenter/i.test(data.org) : false,
        };
      }
    },
    {
      url: `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,reverse,mobile,proxy,hosting,query`,
      parse: (data) => {
        if (data.status !== 'success') return null;
        return {
          ip: data.query,
          country: data.country,
          countryCode: data.countryCode,
          region: data.regionName,
          city: data.city,
          lat: data.lat,
          lon: data.lon,
          timezone: data.timezone,
          isp: data.isp,
          org: data.org,
          as: data.as,
          asName: data.asname,
          reverse: data.reverse,
          isMobile: data.mobile,
          isProxy: data.proxy,
          isHosting: data.hosting,
        };
      }
    }
  ];

  for (const api of apis) {
    try {
      const response = await fetch(api.url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) continue;
      const data = await response.json();
      const parsed = api.parse(data);
      if (parsed && parsed.lat != null && parsed.lon != null && !(parsed.lat === 0 && parsed.lon === 0)) {
        return {
          ...parsed,
          riskIndicators: assessIPRisk({
            ...parsed,
            proxy: parsed.isProxy,
            hosting: parsed.isHosting,
            countryCode: parsed.countryCode,
          }),
          error: null,
        };
      }
    } catch {
      continue;
    }
  }

  return createFallbackResult(ip, 'All geolocation APIs failed');
}

/**
 * Batch IP lookup with rate limiting
 */
export async function batchLookupIPs(ips) {
  const results = [];

  for (let i = 0; i < ips.length; i++) {
    // Rate limit: ip-api allows 45 requests per minute
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    const result = await lookupIP(ips[i]);
    results.push(result);
  }

  return results;
}

/**
 * Assess IP risk based on geolocation data
 */
function assessIPRisk(data) {
  const indicators = [];

  // Proxy/VPN detection
  if (data.proxy) {
    indicators.push({
      type: 'PROXY_VPN',
      severity: 'high',
      description: 'IP is associated with a proxy, VPN, or anonymization service',
    });
  }

  // Hosting/datacenter IP
  if (data.hosting) {
    indicators.push({
      type: 'HOSTING_PROVIDER',
      severity: 'medium',
      description: `IP belongs to a hosting/cloud provider (${data.org || data.isp})`,
    });
  }

  // Known cloud providers
  const cloudProviders = detectCloudProvider(data.org || '', data.isp || '', data.as || '');
  if (cloudProviders) {
    indicators.push({
      type: 'CLOUD_INFRASTRUCTURE',
      severity: 'medium',
      description: `IP hosted on ${cloudProviders} cloud infrastructure`,
    });
  }

  // TOR exit node detection (heuristic)
  if (isTORIndicator(data.org || '', data.isp || '', data.reverse || '')) {
    indicators.push({
      type: 'TOR_EXIT',
      severity: 'critical',
      description: 'IP appears to be a TOR exit node — anonymized traffic',
    });
  }

  // High-risk country (configurable)
  const highRiskCountries = ['RU', 'CN', 'KP', 'IR', 'NG', 'RO', 'UA', 'BY'];
  if (highRiskCountries.includes(data.countryCode)) {
    indicators.push({
      type: 'HIGH_RISK_COUNTRY',
      severity: 'medium',
      description: `IP originates from high-risk region: ${data.country}`,
    });
  }

  return indicators;
}

/**
 * Detect cloud provider from ASN/org data
 */
function detectCloudProvider(org, isp, as) {
  const lowerOrg = (org + ' ' + isp + ' ' + as).toLowerCase();

  if (lowerOrg.includes('amazon') || lowerOrg.includes('aws') || lowerOrg.includes('ec2')) return 'Amazon Web Services (AWS)';
  if (lowerOrg.includes('microsoft') || lowerOrg.includes('azure')) return 'Microsoft Azure';
  if (lowerOrg.includes('google') || lowerOrg.includes('gcp') || lowerOrg.includes('cloud')) return 'Google Cloud Platform';
  if (lowerOrg.includes('digitalocean')) return 'DigitalOcean';
  if (lowerOrg.includes('linode') || lowerOrg.includes('akamai')) return 'Linode/Akamai';
  if (lowerOrg.includes('ovh')) return 'OVH';
  if (lowerOrg.includes('hetzner')) return 'Hetzner';
  if (lowerOrg.includes('vultr')) return 'Vultr';
  if (lowerOrg.includes('cloudflare')) return 'Cloudflare';

  return null;
}

/**
 * Check for TOR-related indicators
 */
function isTORIndicator(org, isp, reverse) {
  const combined = (org + ' ' + isp + ' ' + reverse).toLowerCase();
  return combined.includes('tor') || combined.includes('exit') || combined.includes('relay');
}

/**
 * Create fallback result for failed lookups
 */
function createFallbackResult(ip, errorMessage) {
  return {
    ip,
    country: 'Unknown',
    countryCode: 'XX',
    region: 'Unknown',
    city: 'Unknown',
    lat: 0,
    lon: 0,
    timezone: '',
    isp: 'Unknown',
    org: 'Unknown',
    as: '',
    asName: '',
    reverse: '',
    isMobile: false,
    isProxy: false,
    isHosting: false,
    riskIndicators: [],
    error: errorMessage,
  };
}

/**
 * Calculate IP risk score
 */
export function calculateIPRiskScore(ipResult) {
  if (!ipResult || ipResult.error) return 30;

  let score = 0;

  for (const indicator of ipResult.riskIndicators) {
    switch (indicator.severity) {
      case 'critical': score += 40; break;
      case 'high': score += 30; break;
      case 'medium': score += 15; break;
      case 'low': score += 5; break;
    }
  }

  return Math.min(100, score);
}

/**
 * Get country flag emoji from country code
 */
export function getCountryFlag(countryCode) {
  if (!countryCode || countryCode === 'XX') return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
