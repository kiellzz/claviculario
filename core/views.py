from django.shortcuts import render

def teste_backend(request):
    return render(request, "core/painel.html")

def painel(request):
    return render(request, "core/painel.html")