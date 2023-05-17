function iniciarApp() {

    const resultadoDiv = document.querySelector('#resultado');
    const selectCategoria = document.querySelector('#categorias');
    if (selectCategoria) {
        selectCategoria.addEventListener('change', seleccionarCategoria);
        obtenerCategorias();
    }

    const favoritosDiv = document.querySelector('.favoritos');
    if (favoritosDiv) {
        obtenerFavoritos();
    }
    const modal = new bootstrap.Modal('#modal', {});


    function obtenerCategorias() {
        const url = 'https://www.themealdb.com/api/json/v1/1/categories.php';
        fetch(url)
            .then(respuesta => respuesta.json())
            .then(datos => mostrarCategorias(datos.categories))
    }

    function mostrarCategorias(datos) {
        datos.forEach(dato => {
            const { strCategory } = dato;
            const option = document.createElement('option');
            option.textContent = strCategory;
            option.value = strCategory;
            selectCategoria.appendChild(option);
        });
    }

    function seleccionarCategoria(e) {
        const valor = e.target.value;
        const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${valor}`;
        fetch(url)
            .then(respuesta => respuesta.json())
            .then(datos => filtrarCategoria(datos.meals))
    }

    function filtrarCategoria(recetas) {
        limpiarHTML(resultadoDiv);

        const heading = document.createElement('h3');
        heading.classList.add('text-center', 'text-black', 'my-5');
        heading.textContent = recetas.length ? 'Resultados' : 'No hay resultados';
        resultadoDiv.appendChild(heading);

        recetas.forEach(receta => {
            const { idMeal, strMeal, strMealThumb } = receta;
            const recetaContenedor = document.createElement('DIV');
            recetaContenedor.classList.add('col-md-4');

            const recetaCard = document.createElement('DIV');
            recetaCard.classList.add('card', 'mb-4');

            const recetaImagen = document.createElement('img');
            recetaImagen.classList.add('card-img-top');
            recetaImagen.alt = `Receta de la imagen ${strMeal ?? receta.titulo}`;
            recetaImagen.src = strMealThumb ?? receta.imagen;

            const recetaCardBody = document.createElement('DIV');
            recetaCardBody.classList.add('card-body');

            const recetaHeading = document.createElement('h3');
            recetaHeading.textContent = strMeal ?? receta.titulo;
            recetaHeading.classList.add('card-title', 'mb-3');

            const recetaButton = document.createElement('button');
            recetaButton.classList.add('btn', 'btn-danger', 'w-100');
            recetaButton.textContent = 'Ver Receta';

            recetaButton.onclick = function () {
                mostrarReceta(idMeal ?? receta.id);
            }

            // Inyectar en el código HTML
            recetaCardBody.appendChild(recetaHeading);
            recetaCardBody.appendChild(recetaButton);

            recetaCard.appendChild(recetaImagen);
            recetaCard.appendChild(recetaCardBody);

            recetaContenedor.appendChild(recetaCard);
            resultadoDiv.appendChild(recetaContenedor);
        });
    }

    function mostrarReceta(id) {
        // console.log(id);
        const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
        fetch(url)
            .then(resultado => resultado.json())
            .then(datos => mostrarRecetaModal(datos.meals[0]));

    }

    function mostrarRecetaModal(receta) {
        
        const { idMeal, strInstructions, strMeal, strMealThumb } = receta;
        const modalTitle = document.querySelector('.modal-title');
        const modalBody = document.querySelector('.modal-body');

        modalTitle.textContent = strMeal;
        modalBody.innerHTML = `
            <img class="img-fluid" src="${strMealThumb}" alt="Receta ${strMeal}">
            <h3 class="mt-4">Instrucciones</h3>
            <p>${strInstructions}</p>
            <h3>Ingredientes y Cantidades</h3>
        `;
        const listGroup = document.createElement('UL');
        listGroup.classList.add('list-group');

        // Mostrar cantidades e ingredientes
        for (let i = 1; i <= 20; i++) {
            if (receta[`strIngredient${i}`]) {
                const ingrediente = receta[`strIngredient${i}`];
                const cantidad = receta[`strMeasure${i}`];

                const ingredienteLi = document.createElement('LI');
                ingredienteLi.classList.add('list-group-item');
                ingredienteLi.textContent = `${ingrediente} - ${cantidad}`;

                listGroup.appendChild(ingredienteLi);
            }
        }
        modalBody.appendChild(listGroup);

        const modalFooter = document.querySelector('.modal-footer');
        limpiarHTML(modalFooter);
        // Botones de cerrar y favorito
        const btnFavorito = document.createElement('button');
        btnFavorito.classList.add('btn', 'btn-danger', 'col');
        btnFavorito.textContent = eliminarRecetasDuplicadas(idMeal) ? 'Eliminar Favorito' : 'Agregar Favorito';

        // Agregar localStorage
        btnFavorito.onclick = function () {

            if (eliminarRecetasDuplicadas(idMeal)) { //si ya existe el id en el localstorage..
                eliminarFavorito(idMeal); //entonces llamamos la función de eliminar
                btnFavorito.textContent = 'Guardar Favorito';
                mostrarToast('La receta fue eliminada');
                return; //rompre la condición y no agrega de nuevo como favorito
            }
            agregarFavorito({
                id: idMeal,
                titulo: strMeal,
                imagen: strMealThumb,
            });
            mostrarToast('La receta fue agregada');
            btnFavorito.textContent = 'Eliminar Favorito';
        }

        const btnCerrarModal = document.createElement('button');
        btnCerrarModal.classList.add('btn', 'btn-secondary', 'col');
        btnCerrarModal.textContent = 'Cerrar';
        btnCerrarModal.onclick = function () {
            modal.hide();
        }

        // Agregar botones al footer
        modalFooter.appendChild(btnFavorito);
        modalFooter.appendChild(btnCerrarModal);

        // Muestra el modal
        modal.show();
    }

    // Agregar localStorage
    function agregarFavorito(receta) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        localStorage.setItem('favoritos', JSON.stringify([...favoritos, receta]));
    }

    function eliminarFavorito(id) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        const nuevosFavoritos = favoritos.filter(favorito => favorito.id !== id);
        localStorage.setItem('favoritos', JSON.stringify(nuevosFavoritos));
    }

    function eliminarRecetasDuplicadas(id) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        return favoritos.some(favorito => favorito.id === id);
    }

    function mostrarToast(mensaje) {
        const toastDiv = document.querySelector('#toast');
        const toastBody = document.querySelector('.toast-body');
        const toast = new bootstrap.Toast(toastDiv);
        toastBody.textContent = mensaje;
        toast.show();
    }

    function obtenerFavoritos() {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        if (favoritos.length) {
            console.log(favoritos);
            filtrarCategoria(favoritos);
            return;
        }

        const noFavoritos = document.createElement('P');
        noFavoritos.textContent = 'No hay favoritos aún';
        noFavoritos.classList.add('fs-4', 'text-center', 'font-bold', 'mt-5');
        favoritosDiv.appendChild(noFavoritos);
    }

    function limpiarHTML(selector) {
        while (selector.firstChild) {
            selector.removeChild(selector.firstChild);
        }
    }
}

document.addEventListener('DOMContentLoaded', iniciarApp);

