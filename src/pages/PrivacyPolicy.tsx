// src/pages/PrivacyPolicy.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
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

        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0B0F19', marginBottom: 8 }}>Privacy Policy — TradeZilla</h1>
        <p style={{ color: '#64748B', fontSize: 14, marginBottom: 32 }}>Last Updated: July 2026</p>

        <div style={{ color: '#334155', lineHeight: 1.7, fontSize: 15, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p>
            TradeZilla ("we," "us," "our") respects your privacy. This Privacy Policy explains how we collect, use, share, and protect your personal data when you use the TradeZilla website and application (the "Platform"), in accordance with the Digital Personal Data Protection Act, 2023 ("DPDP Act"), the Information Technology Act, 2000, and the IT (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.
          </p>
          <p>By using the Platform, you consent to the practices described in this Policy.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>1. Information We Collect</h2>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>a) Information you provide directly:</h3>
          <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>Name, email address, phone number (during registration)</li>
            <li>Password (stored in encrypted/hashed form)</li>
            <li>Profile details you choose to add (e.g., city, trading preferences)</li>
          </ul>

          <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1E293B', marginTop: 12, marginBottom: 4 }}>b) Information collected automatically:</h3>
          <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>Usage data (pages visited, features used, simulated trades placed, session duration)</li>
            <li>Device information (browser type, operating system, IP address)</li>
            <li>Cookies and similar tracking technologies (see Section 6)</li>
          </ul>

          <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1E293B', marginTop: 12, marginBottom: 4 }}>c) Information from third parties:</h3>
          <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>If you log in via a third-party service (e.g., Google Sign-In), we may receive basic profile information as permitted by that service.</li>
          </ul>
          
          <p>We do not collect real bank account details, real brokerage credentials, or real financial transaction data, since TradeZilla does not process real trades or payments involving securities.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>2. How We Use Your Information</h2>
          <p>We use your data to:</p>
          <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>Create and manage your account</li>
            <li>Operate and improve the paper trading simulation, leaderboards, and analytics</li>
            <li>Send you service-related communications (e.g., account verification, updates)</li>
            <li>Send optional marketing communications, where you have opted in</li>
            <li>Detect, prevent, and address fraud, abuse, or security issues</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>3. Legal Basis & Consent</h2>
          <p>We process your personal data based on your consent, provided at the time of registration or through your continued use of the Platform. You may withdraw consent at any time by contacting us, though this may limit your ability to use certain features.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>4. Sharing of Information</h2>
          <p>We do not sell your personal data. We may share it with:</p>
          <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>Service providers (e.g., cloud hosting, analytics, email delivery) who process data on our behalf under confidentiality obligations</li>
            <li>Market data providers, where necessary to deliver Platform features</li>
            <li>Legal or regulatory authorities, if required by law, court order, or government request</li>
            <li>A successor entity, in the event of a merger, acquisition, or sale of assets</li>
          </ul>
          <p>All third parties are required to handle your data securely and only for the purposes we specify.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>5. Data Storage & Security</h2>
          <p><strong>5.1</strong> We implement reasonable technical and organizational measures — such as encryption, access controls, and secure servers — to protect your data against unauthorized access, loss, or misuse, in line with the IT Rules, 2011.</p>
          <p><strong>5.2</strong> Data may be stored on servers located in India or other jurisdictions where our hosting providers operate. Where data is transferred outside India, we take steps to ensure it remains protected consistent with the DPDP Act.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>6. Cookies & Tracking Technologies</h2>
          <p>We use cookies and similar technologies to keep you logged in, remember preferences, and understand Platform usage. You can control cookies through your browser settings; disabling them may affect Platform functionality.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>7. Data Retention</h2>
          <p>We retain your personal data for as long as your account is active, or as needed to provide the Platform, comply with legal obligations, resolve disputes, and enforce our agreements. You may request deletion of your data as described in Section 8.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>8. Your Rights</h2>
          <p>Under the DPDP Act, 2023, you have the right to:</p>
          <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>Access the personal data we hold about you</li>
            <li>Correct or update inaccurate or incomplete data</li>
            <li>Withdraw consent and request erasure of your data (subject to legal retention requirements)</li>
            <li>Nominate another individual to exercise your rights in the event of death or incapacity</li>
            <li>Grievance redressal through our Grievance Officer (see Section 10)</li>
          </ul>
          <p>To exercise these rights, contact us at privacy@tradezilla.com.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>9. Children's Privacy</h2>
          <p>The Platform is not directed at individuals under 18 years of age. We do not knowingly collect personal data from minors. If we learn that we have inadvertently collected such data, we will delete it promptly.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>10. Grievance Officer</h2>
          <p>In accordance with the Information Technology Act, 2000, and rules made thereunder, the details of our Grievance Officer are:<br/>
          <strong>Name:</strong> Grievance Officer<br/>
          <strong>Designation:</strong> Grievance Officer<br/>
          <strong>Email:</strong> grievance@tradezilla.com</p>
          <p>We will address grievances within the timelines prescribed under applicable law.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>11. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of material changes via the Platform or email, and the "Last Updated" date above will reflect the most recent revision.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F19', marginTop: 12, marginBottom: 4 }}>12. Contact Us</h2>
          <p>If you have questions about this Privacy Policy or how your data is handled, contact us at:<br/><strong>Email:</strong> privacy@tradezilla.com</p>
        </div>
      </div>
    </div>
  );
}
