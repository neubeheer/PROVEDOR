/* Configuração online do Provedor Tycoon. Deixe em branco para jogar só no aparelho.

   supabaseUrl / supabaseAnonKey  → conta (login) e progresso salvo online.
     Supabase → botão Copy do projeto: "Project URL" e "Publishable key" (ou a antiga "anon public").
     A chave anon é pública por natureza; quem protege os dados são as regras do supabase/schema.sql.

   quadrasUrl → link do banco de quadras no Google Drive (o "App da Web" do Apps Script).
     Termina em /exec. Veja o README, seção "Banco de quadras no Google Drive". */
window.PT_CONFIG = {
  supabaseUrl: 'https://wrvsbdtjtwbjutrtwcqk.supabase.co',
  supabaseAnonKey: 'sb_publishable_x_Sv2GroDmAfaM1DqnE5rQ_gE7dD2Z8',   // cole aqui a Publishable key (começa com sb_publishable_)
  quadrasUrl: 'https://script.google.com/macros/s/AKfycbzijdrkDFG3wMZn-vj6YyTw32Jdy5jDQT2odjEqYO1bPQoNbpX-_L0HMiwPAuHsRg2rqQ/exec'
};
