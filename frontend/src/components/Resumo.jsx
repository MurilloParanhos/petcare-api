function Resumo({ totalClientes, totalAnimais }) {
    return (
        <div>
            <h1>Olá!</h1>
            <p>Aqui está um resumo do sistema.</p>

            <section className="cards">
                <div className="card">
                    <h3>Clientes cadastrados</h3>
                    <p>{totalClientes}</p>
                </div>
                <div className="card">
                    <h3>Animais cadastrados</h3>
                    <p>{totalAnimais}</p>
                </div>
            </section>
        </div>
    );
}

export default Resumo;
