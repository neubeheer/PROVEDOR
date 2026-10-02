/* Configuração online do Provedor Tycoon. Deixe em branco para jogar só no aparelho.

   supabaseUrl / supabaseAnonKey  → conta (login) e progresso salvo online.
     Supabase → Project Settings → API: "Project URL" e a chave "anon public".
     A chave anon é pública por natureza; quem protege os dados são as regras do supabase/schema.sql.

   quadrasUrl → link do banco de quadras no Google Drive (o "App da Web" do Apps Script).
     Termina em /exec. Veja o README, seção "Banco de quadras no Google Drive". */
window.PT_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  quadrasUrl: ''
};
