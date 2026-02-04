const sections = [
  {
    title: 'Principii generale',
    items: [
      'SFP (System Funders Points) recompenseaza sustinatorii QMS.',
      'SFP nu este token, nu este tranzactionabil si nu are valoare financiara directa.'
    ]
  },
  {
    title: 'Prag minim pentru Voting',
    items: [
      'Pentru drept de vot: minimum 10,000 SFP.',
      'Sub prag: utilizatorul poate vedea News & Updates, dar nu poate vota.'
    ]
  },
  {
    title: 'Formula de baza - Donatii',
    items: [
      '0.01 SOL = 100 SFP',
      '1 SOL = 10,000 SFP',
      'Plafon maxim eligibil: 10 SOL = 100,000 SFP',
      'SFP_donatie = (SOL_donat / 0.01) x 100 x bonus'
    ]
  },
  {
    title: 'Bonus Early Supporter (optional)',
    items: [
      'x1.25 pentru early phase',
      'x1.5 pentru primii sustinatori (ex: primii 100)',
      'Bonusul este temporar si limitat.'
    ]
  },
  {
    title: 'Referral',
    items: [
      'Referral valid: cont creat + donatie minima 0.01 SOL.',
      'Recompensa: +200 SFP / referral valid.'
    ]
  },
  {
    title: 'Social Media Promotion (X / Telegram)',
    items: [
      'Postare publica despre QMS, mentinuta minim 7 zile.',
      'Validata de QMS.',
      'Recompensa: +50 SFP / postare, max 2 postari / luna.'
    ]
  },
  {
    title: 'Video Promotion',
    items: [
      'Videoclip public despre QMS, mentinut minim 7 zile.',
      'Se iau in calcul doar vizualizarile din primele 7 zile.',
      'Recompensa: 1 SFP / 100 vizualizari, max 50 SFP / video, max 2 video / luna.'
    ]
  },
  {
    title: 'Formula finala SFP total',
    items: ['SFP_total = SFP_donatie + SFP_referral + SFP_social + SFP_video']
  },
  {
    title: 'Puterea de vot (Voting Power)',
    items: [
      'Pentru utilizatori eligibili: Voting_power = sqrt(SFP_total).',
      'Reduce dominarea whale-ilor si mentine echilibrul decizional.'
    ]
  }
];

export default function SFPRewards() {
  return (
    <div className="mx-auto max-w-[1360px] py-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">SFP Formula</h2>
        <p className="mt-2 text-sm text-slate-500">
          Regulile oficiale pentru System Funders Points (SFP).
        </p>
      </section>

      <div className="mt-8 space-y-6">
        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-slate-800">{section.title}</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              {section.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
