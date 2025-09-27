module.exports = (req, res) => {
  res.status(404).json({
    error: "Rota não encontrada",
    message: `A rota ${req.originalUrl} com o método ${req.method} não existe`,
  });
};
