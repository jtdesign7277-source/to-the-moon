import { useState } from 'react'
import {
  FileText,
  Shield,
  AlertTriangle,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Scale,
  Lock,
  TrendingUp,
  Mail,
  Calendar,
} from 'lucide-react'

// Collapsible Section Component
const Section = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 rounded-lg mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-t-lg transition-colors"
      >
        <span className="font-semibold text-gray-900">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 py-4 prose prose-sm max-w-none">
          {children}
        </div>
      )}
    </div>
  )
}

// Terms of Service Content
const TermsOfService = () => (
  <div>
    <div className="mb-6">
      <p className="text-gray-600">
        Last updated: January 2025
      </p>
      <p className="mt-4 text-gray-700">
        Please read these Terms of Service ("Terms") carefully before using the Stratify platform
        ("Service") operated by Stratify Inc. ("us", "we", or "our").
      </p>
    </div>

    <Section title="1. Acceptance of Terms" defaultOpen={true}>
      <p>
        By accessing or using our Service, you agree to be bound by these Terms. If you disagree
        with any part of the terms, you may not access the Service.
      </p>
      <p className="mt-3">
        You must be at least 18 years old and legally able to enter into contracts to use this Service.
        By using our Service, you represent and warrant that you meet these requirements.
      </p>
    </Section>

    <Section title="2. Description of Service">
      <p>
        Stratify provides a platform for:
      </p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>Connecting to prediction market platforms (Kalshi, Polymarket, Manifold Markets)</li>
        <li>Viewing and analyzing trading strategies</li>
        <li>Backtesting strategies against historical market data</li>
        <li>Automated strategy execution (Pro tier only)</li>
        <li>Educational content about prediction markets</li>
      </ul>
      <p className="mt-3">
        We do not operate prediction markets ourselves. We provide tools to interact with third-party
        platforms. Your use of those platforms is subject to their respective terms of service.
      </p>
    </Section>

    <Section title="3. User Accounts">
      <p>
        When you create an account with us, you must provide accurate, complete, and current information.
        Failure to do so constitutes a breach of the Terms, which may result in immediate termination
        of your account.
      </p>
      <p className="mt-3">
        You are responsible for safeguarding the password and API keys you use to access the Service
        and for any activities or actions under your account. You agree not to disclose your password
        or API keys to any third party.
      </p>
    </Section>

    <Section title="4. API Keys and Third-Party Connections">
      <p>
        Our Service allows you to connect your accounts on third-party prediction market platforms
        using API keys. By providing these keys, you:
      </p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>Authorize us to execute trades on your behalf (if using automated strategies)</li>
        <li>Acknowledge that you are solely responsible for any trades executed</li>
        <li>Understand that API keys are stored securely but you use this feature at your own risk</li>
        <li>Accept responsibility for maintaining the security of your API keys</li>
      </ul>
    </Section>

    <Section title="5. Subscription and Payments">
      <p>
        Some features of our Service require a paid subscription ("Pro" tier). By subscribing, you agree to:
      </p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>Pay the applicable subscription fees</li>
        <li>Automatic renewal unless you cancel before the renewal date</li>
        <li>Provide accurate billing information</li>
      </ul>
      <p className="mt-3">
        Subscription fees are non-refundable except as required by law. We reserve the right to
        change subscription pricing with 30 days notice.
      </p>
    </Section>

    <Section title="6. Prohibited Uses">
      <p>You agree not to use the Service:</p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>In any way that violates applicable laws or regulations</li>
        <li>To engage in market manipulation or fraudulent activities</li>
        <li>To reverse engineer, decompile, or disassemble our software</li>
        <li>To attempt to gain unauthorized access to our systems</li>
        <li>To interfere with or disrupt the Service or servers</li>
        <li>To share your account with others or resell access</li>
        <li>In jurisdictions where prediction market trading is prohibited</li>
      </ul>
    </Section>

    <Section title="7. Intellectual Property">
      <p>
        The Service and its original content, features, and functionality are and will remain the
        exclusive property of Stratify Inc. and its licensors. Our trademarks and trade dress may
        not be used without our prior written consent.
      </p>
      <p className="mt-3">
        Strategies you create using our tools remain your intellectual property. However, by using
        our Service, you grant us a license to use anonymized, aggregated data for improving our
        Service.
      </p>
    </Section>

    <Section title="8. Disclaimer of Warranties">
      <p className="font-semibold text-red-600">
        THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT ANY WARRANTIES OF
        ANY KIND, EXPRESS OR IMPLIED.
      </p>
      <p className="mt-3">
        We do not warrant that:
      </p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>The Service will be uninterrupted, timely, secure, or error-free</li>
        <li>Any trading strategy will be profitable</li>
        <li>Backtest results will predict future performance</li>
        <li>The Service will meet your specific requirements</li>
      </ul>
    </Section>

    <Section title="9. Limitation of Liability">
      <p className="font-semibold">
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, STRATIFY INC. SHALL NOT BE LIABLE FOR ANY
        INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT
        LIMITATION, LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES.
      </p>
      <p className="mt-3">
        This includes but is not limited to losses arising from:
      </p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>Trading losses from strategies executed through our Service</li>
        <li>Service interruptions or downtime</li>
        <li>Unauthorized access to your account</li>
        <li>Errors in backtest calculations or strategy execution</li>
        <li>Third-party platform failures or changes</li>
      </ul>
      <p className="mt-3">
        Our total liability shall not exceed the amount you paid us in the 12 months preceding
        any claim.
      </p>
    </Section>

    <Section title="10. Indemnification">
      <p>
        You agree to defend, indemnify, and hold harmless Stratify Inc. and its officers, directors,
        employees, and agents from any claims, damages, losses, liabilities, and expenses arising
        from your use of the Service or violation of these Terms.
      </p>
    </Section>

    <Section title="11. Termination">
      <p>
        We may terminate or suspend your account immediately, without prior notice, for any reason,
        including breach of these Terms. Upon termination, your right to use the Service will
        immediately cease.
      </p>
      <p className="mt-3">
        You may delete your account at any time. We will delete your data in accordance with our
        Privacy Policy.
      </p>
    </Section>

    <Section title="12. Governing Law">
      <p>
        These Terms shall be governed by the laws of the State of Delaware, United States, without
        regard to its conflict of law provisions.
      </p>
      <p className="mt-3">
        Any disputes arising from these Terms or the Service shall be resolved through binding
        arbitration in accordance with the rules of the American Arbitration Association.
      </p>
    </Section>

    <Section title="13. Changes to Terms">
      <p>
        We reserve the right to modify these Terms at any time. We will provide notice of material
        changes by posting the new Terms on this page and updating the "Last updated" date.
      </p>
      <p className="mt-3">
        Your continued use of the Service after any changes constitutes acceptance of the new Terms.
      </p>
    </Section>

    <Section title="14. Contact Us">
      <p>
        If you have any questions about these Terms, please contact us at:
      </p>
      <p className="mt-2">
        <strong>Email:</strong> legal@stratify.trading<br />
        <strong>Address:</strong> Stratify Inc., Delaware, USA
      </p>
    </Section>
  </div>
)

// Privacy Policy Content
const PrivacyPolicy = () => (
  <div>
    <div className="mb-6">
      <p className="text-gray-600">
        Last updated: January 2025
      </p>
      <p className="mt-4 text-gray-700">
        This Privacy Policy describes how Stratify Inc. ("we", "us", or "our") collects, uses,
        and shares information about you when you use our website and services.
      </p>
    </div>

    <Section title="1. Information We Collect" defaultOpen={true}>
      <p className="font-semibold">Information you provide:</p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li><strong>Account Information:</strong> Email address, password (hashed), name</li>
        <li><strong>Payment Information:</strong> Processed by Stripe; we don't store card details</li>
        <li><strong>API Keys:</strong> Third-party platform API keys you choose to connect</li>
        <li><strong>Strategy Data:</strong> Strategies you create or customize</li>
        <li><strong>Communications:</strong> Emails, support requests, feedback</li>
      </ul>

      <p className="font-semibold mt-4">Information collected automatically:</p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li><strong>Usage Data:</strong> Pages visited, features used, time spent</li>
        <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
        <li><strong>Cookies:</strong> Session cookies, authentication tokens</li>
        <li><strong>Log Data:</strong> Server logs, error reports</li>
      </ul>
    </Section>

    <Section title="2. How We Use Your Information">
      <p>We use the information we collect to:</p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>Provide, maintain, and improve our Service</li>
        <li>Process transactions and send related information</li>
        <li>Send you technical notices, updates, and support messages</li>
        <li>Respond to your comments, questions, and requests</li>
        <li>Monitor and analyze trends, usage, and activities</li>
        <li>Detect, investigate, and prevent fraudulent transactions and abuse</li>
        <li>Personalize and improve your experience</li>
      </ul>
    </Section>

    <Section title="3. How We Share Your Information">
      <p>We may share your information with:</p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li><strong>Service Providers:</strong> Third parties that perform services for us (hosting, payment processing, analytics)</li>
        <li><strong>Third-Party Platforms:</strong> When you connect your accounts (Kalshi, Polymarket, Manifold) using API keys</li>
        <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
        <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
      </ul>
      <p className="mt-3 font-semibold">
        We do NOT sell your personal information to third parties.
      </p>
    </Section>

    <Section title="4. Data Security">
      <p>We implement appropriate security measures to protect your information:</p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>Encryption of data in transit (HTTPS/TLS)</li>
        <li>Encryption of sensitive data at rest (API keys, passwords)</li>
        <li>Regular security audits and updates</li>
        <li>Access controls and authentication</li>
        <li>Secure cloud infrastructure (Railway, AWS)</li>
      </ul>
      <p className="mt-3">
        However, no method of transmission over the Internet is 100% secure. We cannot guarantee
        absolute security.
      </p>
    </Section>

    <Section title="5. Data Retention">
      <p>We retain your information for as long as your account is active or as needed to:</p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>Provide you with our Service</li>
        <li>Comply with our legal obligations</li>
        <li>Resolve disputes and enforce our agreements</li>
      </ul>
      <p className="mt-3">
        You can request deletion of your account and data at any time. We will delete or anonymize
        your data within 30 days, except where retention is required by law.
      </p>
    </Section>

    <Section title="6. Your Rights">
      <p>Depending on your location, you may have the right to:</p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li><strong>Access:</strong> Request a copy of your personal data</li>
        <li><strong>Correction:</strong> Request correction of inaccurate data</li>
        <li><strong>Deletion:</strong> Request deletion of your data</li>
        <li><strong>Portability:</strong> Request your data in a portable format</li>
        <li><strong>Opt-out:</strong> Opt out of marketing communications</li>
        <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
      </ul>
      <p className="mt-3">
        To exercise these rights, contact us at privacy@stratify.trading
      </p>
    </Section>

    <Section title="7. Cookies and Tracking">
      <p>We use cookies and similar technologies to:</p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>Keep you signed in</li>
        <li>Remember your preferences</li>
        <li>Understand how you use our Service</li>
        <li>Improve our Service</li>
      </ul>
      <p className="mt-3">
        You can control cookies through your browser settings. Disabling cookies may affect
        functionality.
      </p>
    </Section>

    <Section title="8. Third-Party Links">
      <p>
        Our Service may contain links to third-party websites (Kalshi, Polymarket, Manifold, etc.).
        We are not responsible for the privacy practices of these sites. We encourage you to read
        their privacy policies.
      </p>
    </Section>

    <Section title="9. Children's Privacy">
      <p>
        Our Service is not intended for anyone under 18. We do not knowingly collect personal
        information from children. If you believe we have collected information from a child,
        please contact us immediately.
      </p>
    </Section>

    <Section title="10. International Transfers">
      <p>
        Your information may be transferred to and processed in countries other than your own.
        These countries may have different data protection laws. By using our Service, you consent
        to such transfers.
      </p>
    </Section>

    <Section title="11. California Privacy Rights (CCPA)">
      <p>If you are a California resident, you have additional rights:</p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>Right to know what personal information is collected</li>
        <li>Right to know if personal information is sold or disclosed</li>
        <li>Right to opt out of the sale of personal information</li>
        <li>Right to non-discrimination for exercising these rights</li>
      </ul>
      <p className="mt-3">
        We do not sell personal information as defined by the CCPA.
      </p>
    </Section>

    <Section title="12. Changes to This Policy">
      <p>
        We may update this Privacy Policy from time to time. We will notify you of any changes by
        posting the new policy on this page and updating the "Last updated" date.
      </p>
    </Section>

    <Section title="13. Contact Us">
      <p>
        If you have questions about this Privacy Policy, please contact us at:
      </p>
      <p className="mt-2">
        <strong>Email:</strong> privacy@stratify.trading<br />
        <strong>Address:</strong> Stratify Inc., Delaware, USA
      </p>
    </Section>
  </div>
)

// Risk Disclaimer Content
const RiskDisclaimer = () => (
  <div>
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-red-800">
            IMPORTANT: PLEASE READ THIS ENTIRE DOCUMENT CAREFULLY
          </p>
          <p className="text-red-700 mt-1">
            Trading in prediction markets involves substantial risk of loss and is not suitable
            for all investors. Past performance is not indicative of future results.
          </p>
        </div>
      </div>
    </div>

    <Section title="1. No Investment Advice" defaultOpen={true}>
      <p>
        Stratify is a technology platform that provides tools for analyzing and executing trades
        on prediction markets. <strong>We do not provide investment advice, financial advice,
        trading advice, or any other sort of advice.</strong>
      </p>
      <p className="mt-3">
        Nothing on our platform should be construed as:
      </p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>A recommendation to buy, sell, or hold any position</li>
        <li>An endorsement of any trading strategy</li>
        <li>A promise or guarantee of any returns</li>
        <li>Professional financial or legal advice</li>
      </ul>
      <p className="mt-3">
        You should consult with qualified professionals before making any trading decisions.
      </p>
    </Section>

    <Section title="2. Risk of Loss">
      <p className="font-bold text-red-600">
        TRADING IN PREDICTION MARKETS CARRIES A HIGH LEVEL OF RISK AND MAY NOT BE SUITABLE FOR
        ALL INVESTORS. YOU COULD LOSE SOME OR ALL OF YOUR INVESTED CAPITAL.
      </p>
      <p className="mt-3">Specific risks include:</p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li><strong>Market Risk:</strong> Prediction market prices can move against your position</li>
        <li><strong>Liquidity Risk:</strong> You may not be able to exit positions at desired prices</li>
        <li><strong>Platform Risk:</strong> Third-party platforms may experience outages or failures</li>
        <li><strong>Execution Risk:</strong> Automated strategies may not execute as expected</li>
        <li><strong>Regulatory Risk:</strong> Prediction markets face evolving regulatory landscapes</li>
        <li><strong>Technology Risk:</strong> Software bugs, API failures, or connectivity issues</li>
      </ul>
    </Section>

    <Section title="3. Past Performance Disclaimer">
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="font-bold text-yellow-800">
          PAST PERFORMANCE IS NOT INDICATIVE OF FUTURE RESULTS
        </p>
      </div>
      <p className="mt-4">
        Backtest results shown on our platform are based on historical data and hypothetical trades.
        They have important limitations:
      </p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>Backtests are simulated and did not involve real money</li>
        <li>Historical market conditions may not repeat</li>
        <li>Backtests cannot account for all real-world factors (slippage, fees, liquidity)</li>
        <li>Results may be affected by survivorship bias</li>
        <li>Strategy performance can degrade over time as markets become more efficient</li>
      </ul>
      <p className="mt-3">
        A strategy that performed well historically may perform poorly in the future. There is no
        guarantee that any strategy will achieve similar results going forward.
      </p>
    </Section>

    <Section title="4. Hypothetical Performance">
      <p>
        Many of the results presented on our platform are hypothetical or simulated. Hypothetical
        trading does not involve financial risk and cannot completely account for the impact of
        financial risk in actual trading.
      </p>
      <p className="mt-3">
        There are numerous factors related to the markets in general or to the implementation of
        any specific trading strategy which cannot be fully accounted for in the preparation of
        hypothetical performance results.
      </p>
    </Section>

    <Section title="5. Automated Trading Risks">
      <p>
        If you use our automated strategy execution features (Pro tier), you should be aware of
        additional risks:
      </p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>Automated systems may execute trades faster than you can intervene</li>
        <li>Software bugs could result in unintended trades or losses</li>
        <li>API connectivity issues could prevent proper execution</li>
        <li>Market conditions could change rapidly during execution</li>
        <li>Stop losses and risk limits may not be triggered in all conditions</li>
      </ul>
      <p className="mt-3 font-semibold">
        You should never invest more than you can afford to lose and should monitor automated
        strategies regularly.
      </p>
    </Section>

    <Section title="6. Third-Party Platform Risks">
      <p>
        Stratify connects to third-party prediction market platforms. We are not responsible for:
      </p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>The solvency or reliability of these platforms</li>
        <li>Accuracy of market data provided by these platforms</li>
        <li>Changes to their APIs, terms, or availability</li>
        <li>Security breaches on their systems</li>
        <li>Their regulatory compliance</li>
      </ul>
    </Section>

    <Section title="7. Regulatory Considerations">
      <p>
        Prediction markets may be subject to various regulations depending on your jurisdiction.
        It is your responsibility to:
      </p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>Understand the laws applicable to you</li>
        <li>Ensure prediction market trading is legal in your jurisdiction</li>
        <li>Comply with tax obligations on any gains</li>
        <li>Report trading activity as required by law</li>
      </ul>
      <p className="mt-3">
        We do not provide legal or tax advice. Consult with qualified professionals.
      </p>
    </Section>

    <Section title="8. No Guarantee of Availability">
      <p>
        We do not guarantee that our Service will be available at all times. The Service may be
        interrupted for maintenance, upgrades, or circumstances beyond our control. Trading
        opportunities may be missed during service interruptions.
      </p>
    </Section>

    <Section title="9. Your Responsibility">
      <p>
        By using Stratify, you acknowledge that:
      </p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>You are solely responsible for your trading decisions</li>
        <li>You have read and understood these risk disclosures</li>
        <li>You are financially able to bear potential losses</li>
        <li>You will not hold Stratify liable for any losses</li>
        <li>You understand prediction market trading may not be suitable for you</li>
      </ul>
    </Section>

    <Section title="10. Seek Professional Advice">
      <p>
        Before trading in prediction markets, we strongly recommend that you:
      </p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>Consult with a licensed financial advisor</li>
        <li>Understand your risk tolerance and financial situation</li>
        <li>Only trade with money you can afford to lose</li>
        <li>Start with small positions to understand the markets</li>
        <li>Educate yourself thoroughly about prediction markets</li>
      </ul>
    </Section>

    <div className="mt-8 p-4 bg-gray-100 border border-gray-300 rounded-lg">
      <p className="text-sm text-gray-700">
        <strong>By using Stratify, you acknowledge that you have read, understood, and agree to
        this Risk Disclaimer.</strong> If you do not agree with any part of this disclaimer, you
        should not use our Service.
      </p>
      <p className="text-sm text-gray-600 mt-2">
        Questions? Contact us at risk@stratify.trading
      </p>
    </div>
  </div>
)

// Tab Button Component
const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 font-medium rounded-lg transition-all ${
      active
        ? 'bg-indigo-600 text-white shadow-md'
        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="hidden sm:inline">{label}</span>
  </button>
)

// Main Legal Page Component
const Legal = ({ initialTab = 'terms', onBack }) => {
  const [activeTab, setActiveTab] = useState(initialTab)

  const tabs = [
    { id: 'terms', label: 'Terms of Service', icon: FileText },
    { id: 'privacy', label: 'Privacy Policy', icon: Shield },
    { id: 'risk', label: 'Risk Disclaimer', icon: AlertTriangle },
  ]

  const getTitle = () => {
    switch (activeTab) {
      case 'terms':
        return 'Terms of Service'
      case 'privacy':
        return 'Privacy Policy'
      case 'risk':
        return 'Risk Disclaimer'
      default:
        return 'Legal'
    }
  }

  const getIcon = () => {
    switch (activeTab) {
      case 'terms':
        return Scale
      case 'privacy':
        return Lock
      case 'risk':
        return TrendingUp
      default:
        return FileText
    }
  }

  const Icon = getIcon()

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <Icon className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{getTitle()}</h1>
            <p className="text-gray-600">Stratify Legal Documents</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            icon={tab.icon}
            label={tab.label}
          />
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeTab === 'terms' && <TermsOfService />}
        {activeTab === 'privacy' && <PrivacyPolicy />}
        {activeTab === 'risk' && <RiskDisclaimer />}
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p className="flex items-center justify-center gap-2">
          <Mail className="w-4 h-4" />
          Questions? Contact legal@stratify.trading
        </p>
        <p className="flex items-center justify-center gap-2 mt-1">
          <Calendar className="w-4 h-4" />
          All documents last updated January 2025
        </p>
      </div>
    </div>
  )
}

export default Legal
