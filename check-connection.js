const dns = require('dns').promises;
const net = require('net');

async function checkSupabaseConnection() {
  const hostname = 'dtlylrntpvgzauqcbmfv.supabase.co';
  
  console.log(`\n🔍 Checking DNS resolution for: ${hostname}\n`);
  
  try {
    // Check IPv4 (A records)
    console.log('━━━ IPv4 (A Records) ━━━');
    try {
      const ipv4Addresses = await dns.resolve4(hostname);
      console.log('✅ IPv4 addresses found:');
      ipv4Addresses.forEach(ip => console.log(`   ${ip}`));
    } catch (err) {
      console.log('❌ No IPv4 addresses found');
    }
    
    // Check IPv6 (AAAA records)
    console.log('\n━━━ IPv6 (AAAA Records) ━━━');
    try {
      const ipv6Addresses = await dns.resolve6(hostname);
      console.log('✅ IPv6 addresses found:');
      ipv6Addresses.forEach(ip => console.log(`   ${ip}`));
    } catch (err) {
      console.log('❌ No IPv6 addresses found');
    }
    
    // Check what Node.js will use by default
    console.log('\n━━━ Default Resolution (what Node.js will use) ━━━');
    const addresses = await dns.lookup(hostname, { all: true });
    addresses.forEach(addr => {
      console.log(`${addr.family === 4 ? 'IPv4' : 'IPv6'}: ${addr.address}`);
    });
    
    // Test actual connection
    console.log('\n━━━ Testing Actual Connection ━━━');
    const testConnection = (host, port, family) => {
      return new Promise((resolve, reject) => {
        const socket = net.createConnection({
          host,
          port,
          family, // 4 for IPv4, 6 for IPv6
          timeout: 5000
        });
        
        socket.on('connect', () => {
          console.log(`✅ Successfully connected via IPv${family} to ${socket.remoteAddress}:${socket.remotePort}`);
          socket.destroy();
          resolve(true);
        });
        
        socket.on('error', (err) => {
          console.log(`❌ IPv${family} connection failed: ${err.message}`);
          resolve(false);
        });
        
        socket.on('timeout', () => {
          console.log(`❌ IPv${family} connection timeout`);
          socket.destroy();
          resolve(false);
        });
      });
    };
    
    // Test IPv4 connection to Supabase (HTTPS port 443)
    await testConnection(hostname, 443, 4);
    
    // Test IPv6 connection to Supabase (HTTPS port 443)
    await testConnection(hostname, 443, 6);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSupabaseConnection();
