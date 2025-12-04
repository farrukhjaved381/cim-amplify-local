import Head from "next/head"

export default function MasterFeeAgreement() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100">
      <Head>
        <title>Master Fee Agreement | CIM Amplify</title>
        <meta name="description" content="Master Fee Agreement for CIM Amplify Services" />
      </Head>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-12 text-primary">CIM AMPLIFY MASTER FEE AGREEMENT</h1>

        <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
          <section className="mb-8">
            <p className="text-gray-700 leading-relaxed">
              This Master Fee Agreement ("Agreement") is entered into by and between CIM Amplify ("CIM Amplify") and the
              undersigned party ("Recipient"), effective upon Recipient's acceptance of this Agreement during the buyer
              registration process on the CIM Amplify platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">1. Scope</h2>
            <p className="text-gray-700 leading-relaxed">
              Recipient acknowledges that CIM Amplify may introduce Recipient to opportunities to acquire businesses
              ("Target Companies"). This Agreement governs the payment of success fees to CIM Amplify in the event
              Recipient completes a transaction involving a Target Company introduced through CIM Amplify.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">2. Definition of Introduce, Introduced or Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              CIM Amplify is a platform where Recipient is invited to learn about a company for sale. For the purpose of this
              agreement Introduce, Introduced or Introduction means clicking on <strong>"Move to Active"</strong> on the CIM Amplify platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">3. Fee Structure</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Recipient agrees to pay CIM Amplify a success fee of <strong>0.5% (50 basis points)</strong> of Transaction Value, payable
              upon the closing of any Transaction. The minimum success fee payable for any Transaction shall be <strong>$60,000 USD</strong>.
            </p>
            <p className="text-gray-700 leading-relaxed mb-2">
              Example: A transaction valued at $22,000,000 USD would result in a success fee of $110,000 USD.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Example: A transaction valued at $10,000,000 USD would result in the minimum success fee of $60,000 USD
            </p>

            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Future fee changes:</strong> In the event of a future fee adjustment Recipient will be notified via the email address registered with
              CIM Amplify on Recipient's buyer profile. Current fees can also be found in the FAQ section of the CIM Amplify website at{" "}
              <a className="text-blue-600 hover:underline" href="https://www.cimamplify.com/" target="_blank">https://www.cimamplify.com/</a>{" "}
              Any Introduced Target Companies that are "Active" at the time of a fee adjustment will not be subject to said fee change.
            </p>

            <p className="text-gray-700 leading-relaxed">
              <strong>Currency Conversion and Payment:</strong> If a Transaction is consummated in a currency other than U.S. dollars, the Transaction Value shall be converted into USD using the prevailing
              exchange rate on the closing date of the Transaction as published by the U.S. Federal Reserve or another reliable financial institution agreed to by CIM Amplify. All fees under this Agreement shall be paid in U.S. dollars.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">4. Definition of Transaction Value</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              "Transaction Value" means the enterprise value of the Target Company as determined at closing, representing the
              total consideration paid or committed by Recipient at closing, including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>Cash, securities, and other consideration paid at closing</li>
              <li>Principal amount of promissory notes and deferred payment obligations issued at closing</li>
              <li>Assumption of seller debt and liabilities as agreed in the transaction documents</li>
              <li>Fair market value of seller equity rollover or retained interests</li>
              <li>Net cash and debt of Target Company as of closing (enterprise value basis)</li>
              <li>Non variable earnouts, milestone payments, or other future payments</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">Transaction Value explicitly excludes:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>Variable earnouts, variable milestone payments, or other contingent future payments</li>
              <li>Working capital adjustments after closing</li>
              <li>Transaction expenses (legal, accounting, due diligence, financing fees)</li>
              <li>Employment or consulting agreements with seller principals entered separately from the acquisition</li>
              <li>Breakup fees or deposits that do not apply toward final purchase price</li>
              <li>Post-closing adjustments</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              <strong>Enterprise Value Calculation:</strong> Transaction Value represents the enterprise value paid for the Target Company, calculated as equity value plus assumed net debt, ensuring the fee applies to the full economic value of the business acquired regardless of capital structure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">5. Prior Review Exception to Fee Obligation</h2>
             <p className="text-gray-700 leading-relaxed mb-4">
              No fee shall be payable to CIM Amplify if, after clicking <strong>"Move to Active,"</strong> you provide written notice and documentary evidence demonstrating that you were actively reviewing or had previously reviewed the Target Company prior to the date of clicking <strong>"Move to Active."</strong><br/>
              <strong>Acceptable Proof shall include, but is not limited to:</strong>
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>Dated correspondence (email, letter, or other written communication) between you and the Target Company's advisor or representative regarding the Target Company;</li>
              <li>Signed confidentiality or non-disclosure agreements with the Target Company or its advisor;</li>
              <li>Term sheets, letters of intent, or other negotiation documents;</li>
              <li>Internal review memoranda or investment committee materials dated prior to clicking "Move to Active."</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Procedure:</strong> You must submit such proof to CIM Amplify at <a href="mailto:info@cimamplify.com" className="text-blue-600 hover:underline">info@cimamplify.com</a> when you become aware of the Prior Review. Failure to provide proof shall result in the full fee becoming due and payable based on Payment Terms below. CIM Amplify shall have ten (10) business days to review and accept or dispute the proof provided.
            </p>
          </section>
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">6. Payment Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              Fees are due and payable within <strong>30 business days</strong> of the closing of any Transaction involving a Target Company introduced by CIM Amplify. Fees not received within the above noted 30 days will be subject to a compounding <strong>2% per 30 days</strong> interest charge.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">7. Term</h2>
            <p className="text-gray-700 leading-relaxed">This Agreement shall apply to all Transactions consummated within <strong>24 months</strong> of introduction by CIM Amplify.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">8. Reporting Requirement</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              Recipient agrees to notify CIM Amplify in writing within <strong>5 business days</strong> of closing any transaction involving a Target Company introduced by CIM Amplify. Notice shall include the closing date and Transaction Value. Notices shall be sent via email to{" "}
              <a href="mailto:team@cimamplify.com" className="text-blue-600 hover:underline">team@cimamplify.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">9. Acknowledgment</h2>
            <p className="text-gray-700 leading-relaxed mb-2">Recipient acknowledges and agrees:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>This Agreement is effective upon registration as a buyer on CIM Amplify;</li>
              <li>After Introduction, the fee applies upon a successful transaction between Recipient and Target Company;</li>
              <li>CIM Amplify is not acting as a broker-dealer and is not providing securities advice;</li>
              <li>Fees are due even if a separate intermediary (e.g., M&A advisor or broker) is involved.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">10. Miscellaneous</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p><strong>Governing Law:</strong> This Agreement shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of laws principles.</p>
              <p><strong>Entire Agreement:</strong> This document constitutes the entire agreement between the parties regarding the subject matter.</p>
              <p><strong>Modifications:</strong> Any changes must be in writing and signed by both parties.</p>
            </div>
          </section>

          <section className="mb-8">
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-gray-400">
              <p className="uppercase font-bold text-primary leading-relaxed">
                BY REGISTERING AS A BUYER ON CIM AMPLIFY AND ACCEPTING THIS AGREEMENT, RECIPIENT ACKNOWLEDGES HAVING READ,
                UNDERSTOOD, AND AGREED TO THE TERMS ABOVE.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
