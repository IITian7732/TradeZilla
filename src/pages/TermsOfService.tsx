// src/pages/TermsOfService.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9', padding: '40px 20px', fontFamily: 'inherit' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', background: '#FFFFFF', borderRadius: 16, padding: 32, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontWeight: 600, fontSize: 15, marginBottom: 24, padding: 0 }}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0B0F19', marginBottom: 8 }}>Terms of Service — TradeZilla</h1>
        <p style={{ color: '#64748B', fontSize: 14, marginBottom: 32 }}>Last Updated: July 2026</p>

        <div style={{ color: '#334155', lineHeight: 1.7, fontSize: 15, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p>
            Welcome to TradeZilla ("TradeZilla," "we," "us," or "our"), a virtual/paper trading simulation platform for the Indian stock market. These Terms of Service ("Terms") govern your access to and use of the TradeZilla website and application (the "Platform"). By creating an account or using the Platform, you agree to be bound by these Terms. If you do not agree, please do not use the Platform.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>1. Nature of the Service — Simulated Trading Only</h2>
          <p><strong>1.1</strong> TradeZilla is a paper trading / virtual trading simulator. All trades, portfolios, profits, and losses on the Platform are entirely simulated using virtual currency and do not involve real money, real securities, or real transactions of any kind.</p>
          <p><strong>1.2</strong> TradeZilla is not a stockbroker, investment adviser, portfolio manager, or financial intermediary, and is not registered with the Securities and Exchange Board of India ("SEBI") or any other regulatory authority, because it does not facilitate real trades or handle real client funds or securities.</p>
          <p><strong>1.3</strong> Nothing on the Platform constitutes investment advice, a recommendation, or a solicitation to buy or sell any security. Any performance you achieve in simulated trading does not guarantee or indicate similar results in real markets.</p>
          <p><strong>1.4</strong> Market data, prices, and quotes displayed on the Platform may be delayed, approximate, sourced from third parties, or simulated, and should not be relied upon for real-world trading or investment decisions.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>2. Eligibility</h2>
          <p><strong>2.1</strong> You must be at least 18 years old and capable of entering into a binding contract under the Indian Contract Act, 1872, to use the Platform.</p>
          <p><strong>2.2</strong> By registering, you represent that all information you provide is accurate and current.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>3. Account Registration & Security</h2>
          <p><strong>3.1</strong> You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.</p>
          <p><strong>3.2</strong> You agree to notify us immediately at support@tradezilla.com of any unauthorized use of your account.</p>
          <p><strong>3.3</strong> We reserve the right to suspend or terminate accounts that provide false information or violate these Terms.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>4. Virtual Currency</h2>
          <p><strong>4.1</strong> Any virtual currency, credits, or points ("Virtual Currency") provided on the Platform have no real-world monetary value, cannot be exchanged for cash or any other form of legal tender, and cannot be transferred outside the Platform.</p>
          <p><strong>4.2</strong> We may reset, adjust, or revoke Virtual Currency balances at our discretion, including to correct errors or prevent abuse.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>Use automated scripts, bots, or scraping tools to manipulate leaderboard rankings or simulated performance;</li>
            <li>Attempt to gain unauthorized access to the Platform, other accounts, or our systems;</li>
            <li>Use the Platform to distribute malware, spam, or unlawful content;</li>
            <li>Misrepresent the Platform as a real trading, brokerage, or investment advisory service;</li>
            <li>Reverse-engineer, copy, or resell the Platform's software or content without our written consent.</li>
          </ul>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>6. Market Data & Third-Party Content</h2>
          <p><strong>6.1</strong> Market data may be licensed from or sourced through third-party providers. We do not guarantee the accuracy, completeness, or timeliness of this data.</p>
          <p><strong>6.2</strong> The Platform may link to third-party websites or services. We are not responsible for the content or practices of those third parties.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>7. Intellectual Property</h2>
          <p>All content, branding, software, and design on the Platform are owned by TradeZilla or its licensors and are protected under applicable Indian intellectual property laws. You may not copy, modify, or distribute this content without our prior written permission.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>8. Disclaimer of Warranties</h2>
          <p>The Platform is provided on an "as is" and "as available" basis. We make no warranties, express or implied, regarding the accuracy, reliability, or availability of the Platform, market data, or simulated results.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>9. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, TradeZilla and its team shall not be liable for any indirect, incidental, or consequential damages — including any real-world financial decisions or losses you make based on your experience using the Platform.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>10. Indemnification</h2>
          <p>You agree to indemnify and hold TradeZilla harmless from any claims, damages, or expenses arising out of your misuse of the Platform or violation of these Terms.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>11. Suspension & Termination</h2>
          <p>We may suspend or terminate your account at our discretion, with or without notice, for violation of these Terms or for any reason we deem necessary to protect the Platform or its users.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>12. Changes to These Terms</h2>
          <p>We may update these Terms from time to time. Continued use of the Platform after changes take effect constitutes acceptance of the revised Terms. Material changes will be notified via the Platform or email.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>13. Governing Law & Dispute Resolution</h2>
          <p>These Terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts at Mumbai, India.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>14. Contact Us</h2>
          <p>For any questions about these Terms, contact us at:<br/><strong>Email:</strong> support@tradezilla.com</p>
        </div>
      </div>
    </div>
  );
}
