from django.urls import path
from . import views

urlpatterns = [
    path('', views.expenses_view, name='expenses'),
    path('create/', views.expense_create_view, name='expense_create'),
    path('<int:pk>/edit/', views.expense_edit_view, name='expense_edit'),
    path('<int:pk>/delete/', views.expense_delete_view, name='expense_delete'),
]